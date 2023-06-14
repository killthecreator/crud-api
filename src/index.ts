import cluster from 'cluster';
import { cpus } from 'os';
import { type IncomingMessage, type ServerResponse, type RequestOptions, createServer } from 'http';
import { server, HOST, PORT } from './server';
import { dbServer, DB_PORT, dbReqOptions } from './db';
import { doRequest, errorChecker, bodyParser, statusCodes } from './utils';

const numCPUs = cpus().length;

const serverPorts = new Array(numCPUs).fill(0).map((_item, index) => PORT + index + 1);

let curServerPortIndex = 0;

const reqHandler = async (req: IncomingMessage, res: ServerResponse) => {
  const curServerPort = serverPorts[curServerPortIndex];
  curServerPortIndex === serverPorts.length - 1 ? (curServerPortIndex = 0) : curServerPortIndex++;

  const { url, method } = req;
  res.setHeader('Content-type', 'application/json');

  const options: RequestOptions = {
    hostname: HOST,
    port: curServerPort,
    path: url,
    headers: {
      'Content-Type': 'application/json',
    },
    method,
  };

  let resBody: string | undefined = undefined;
  try {
    const reqBody = await bodyParser(req);
    const workerResponse = await bodyParser(await doRequest(options, reqBody));
    resBody = JSON.stringify(workerResponse);
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

  serverPorts.forEach((serverPort) => {
    const child = cluster.fork({ PORT: serverPort });
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
