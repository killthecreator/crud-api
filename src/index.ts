import cluster from 'cluster';
import { cpus } from 'os';
import { server } from './server';

const numCPUs = cpus().length;

const PORT = Number(process.env.PORT) || 4000;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({ PORT: PORT + i });
  }

  cluster.on('exit', (worker, _code, _signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  console.log(PORT);
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
