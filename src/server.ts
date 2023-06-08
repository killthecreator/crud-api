import { createServer, type IncomingMessage, type ServerResponse } from 'http';

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  switch (req.url) {
    case '/posts':
      if (req.method === 'GET') {
        res.end(JSON.stringify(1));
      }
      break;

    default: {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Resource not found' }));
    }
  }
};

const port = 3000;
const host = 'localhost';

const server = createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
