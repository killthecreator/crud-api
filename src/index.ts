import cluster from 'cluster';
import { cpus } from 'os';
import { server } from './server';
import type { IncomingMessageWithBody } from './types';
import type { ServerResponse } from 'http';
import { request, createServer } from 'http';
//import { bodyParser } from './utils';

const numCPUs = cpus().length;

const PORT = Number(process.env.PORT) ?? 4000;
const HOST = process.env.HOST ?? 'localhost';
const servers = new Array(numCPUs).fill(0).map((_item, index) => PORT + index + 1);

let currentServer = 0;

const handler = async (req: IncomingMessageWithBody, res: ServerResponse) => {
  const { method, url, headers, body } = req;
  const server = servers[currentServer];
  currentServer === servers.length - 1 ? (currentServer = 0) : currentServer++;
  const options = {
    hostname: HOST,
    port: server,
    path: url,
    headers,
    method,
    body,
  };

  const reqToWorker = request(options, async (res2: IncomingMessageWithBody) => {
    //await bodyParser(res2);
    console.log(res2.body);
    let body = '';
    res2.on('data', (chunk) => {
      body += chunk;
    });
    res2.on('end', () => {
      res.end(JSON.stringify(JSON.parse(body)));
    });
  });

  reqToWorker.end();
};

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  createServer((req, res) => handler(req, res)).listen(PORT, () => {
    console.log(`Load ballancer is running on http://${HOST}:${PORT}`);
  });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({ PORT: servers[i] });
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started. Server is running on http://${HOST}:${PORT}`);
  });
}
