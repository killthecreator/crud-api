import cluster from 'cluster';
import { availableParallelism } from 'os';
import { type IncomingMessage, type ServerResponse, type RequestOptions, createServer } from 'http';
import { server, HOST, PORT } from './server';
import { dbServer, DB_PORT, dbReqOptions } from './db';
import { doRequest, errorChecker, bodyParser, statusCodes } from './utils';

const numCPUs = availableParallelism();

const workerPorts = new Array(numCPUs - 1).fill(0).map((_item, index) => PORT + index + 1);

let curServerPortIndex = 0;

const reqHandler = async (req: IncomingMessage, res: ServerResponse) => {
  const curWorkerPort = workerPorts[curServerPortIndex];
  curServerPortIndex === workerPorts.length - 1 ? (curServerPortIndex = 0) : curServerPortIndex++;

  const { url, method } = req;
  res.setHeader('Content-type', 'application/json');

  const options: RequestOptions = {
    hostname: HOST,
    port: curWorkerPort,
    path: url,
    headers: {
      'Content-Type': 'application/json',
    },
    method,
  };

  let resBody: string | undefined = undefined;
  try {
    const reqBody = await bodyParser(req);
    const responseFromWorker = await doRequest(options, reqBody);
    const parsedResponse = await bodyParser(responseFromWorker);
    if (responseFromWorker.statusCode) res.statusCode = responseFromWorker.statusCode;
    resBody = JSON.stringify(parsedResponse);
  } catch (error) {
    res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
    resBody = JSON.stringify(errorChecker(error));
  } finally {
    res.end(resBody);
  }
};

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  dbServer.listen(DB_PORT);

  createServer(reqHandler).listen(PORT, () => {
    console.log(`Load ballancer is running on http://${HOST}:${PORT}`);
  });

  workerPorts.forEach((workerPort) => {
    const child = cluster.fork({ PORT: workerPort });
    child.on('message', async (message) => {
      await doRequest(dbReqOptions('POST'), message);
    });
  });

  cluster.on('exit', (worker) => console.log(`Worker ${worker.process.pid} died`));
} else {
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started. Server is running on http://${HOST}:${PORT}`);
  });
}
