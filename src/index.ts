import cluster from 'cluster';
import { cpus } from 'os';
import { type IncomingMessage, type ServerResponse, request, createServer } from 'http';
import { server, HOST, PORT } from './server';
import { bodyParser } from './utils';

const numCPUs = cpus().length;

const serverPorts = new Array(numCPUs).fill(0).map((_item, index) => PORT + index + 1);

let curServerPortIndex = 0;
const reqHandler = async (req: IncomingMessage, res: ServerResponse) => {
  const { method, url, headers } = req;
  const curServerPort = serverPorts[curServerPortIndex];
  curServerPortIndex === serverPorts.length - 1 ? (curServerPortIndex = 0) : curServerPortIndex++;

  const options = {
    hostname: HOST,
    port: curServerPort,
    path: url,
    headers,
    method,
  };

  const reqToWorker = request(options, async (res2: IncomingMessage) => {
    const body = await bodyParser(res2);
    res.end(JSON.stringify(body));
  });

  reqToWorker.end();
};

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  createServer(reqHandler).listen(PORT, () => {
    console.log(`Load ballancer is running on http://${HOST}:${PORT}`);
  });

  serverPorts.forEach((serverPort) => cluster.fork({ PORT: serverPort }));

  cluster.on('exit', (worker) => console.log(`Worker ${worker.process.pid} died`));
} else {
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started. Server is running on http://${HOST}:${PORT}`);
  });
}
