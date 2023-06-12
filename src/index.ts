import cluster from 'cluster';
import { cpus } from 'os';
import {
  type IncomingMessage,
  type ServerResponse,
  type RequestOptions,
  request,
  createServer,
} from 'http';
import { server, HOST, PORT } from './server';
import { bodyParser } from './utils';
import { dbServer, DB_PORT, dbReqOptions } from './db';
import { statusCodes } from './utils';

const numCPUs = cpus().length;

const serverPorts = new Array(numCPUs).fill(0).map((_item, index) => PORT + index + 1);

let curServerPortIndex = 0;

const reqHandler = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method, headers } = req;
  const curServerPort = serverPorts[curServerPortIndex];
  curServerPortIndex === serverPorts.length - 1 ? (curServerPortIndex = 0) : curServerPortIndex++;
  res.setHeader('Content-type', 'application/json');
  const options: RequestOptions = {
    hostname: HOST,
    port: curServerPort,
    path: url,
    headers,
    method,
  };

  const reqBody = await bodyParser(req);

  const reqToWorker = request(options, async (resFromWorker: IncomingMessage) => {
    const resBody = await bodyParser(resFromWorker);
    res.statusCode = resFromWorker.statusCode ?? statusCodes.INTERNAL_SERVER_ERR;
    res.end(JSON.stringify(resBody));
  });

  reqToWorker.write(JSON.stringify(reqBody));
  reqToWorker.end();
};

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  dbServer.listen(DB_PORT, () => {
    console.log(`DB is running`);
  });

  createServer(reqHandler).listen(PORT, () => {
    console.log(`Load ballancer is running on http://${HOST}:${PORT}`);
  });

  serverPorts.forEach((serverPort) => {
    const child = cluster.fork({ PORT: serverPort });
    child.on('message', (message) => {
      const reqToDb = request(dbReqOptions('POST'));
      reqToDb.write(JSON.stringify(message));
      reqToDb.end();
    });
  });

  cluster.on('exit', (worker) => console.log(`Worker ${worker.process.pid} died`));
} else {
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started. Server is running on http://${HOST}:${PORT}`);
  });
}
