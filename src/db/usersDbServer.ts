import { usersController } from './../controllers';
import { type IncomingMessage, type ServerResponse, type RequestOptions, createServer } from 'http';
import { statusCodes, bodyParser } from './../utils';
import { HOST } from './../server';

export const DB_PORT = Number(process.env.DB_PORT) ?? 3000;

export const dbServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  switch (req.method) {
    case 'GET':
      const users = usersController.allUsers;
      res.statusCode = statusCodes.OK;
      res.end(JSON.stringify(users));
      break;
    case 'POST':
      const reqBody = await bodyParser(req);
      res.statusCode = statusCodes.CREATED;
      usersController.allUsers = reqBody;
      res.end();
      break;
  }
});

export const dbReqOptions = (method: 'GET' | 'POST'): RequestOptions => ({
  hostname: HOST,
  port: DB_PORT,
  method,
  headers: {
    'Content-Type': 'application/json',
  },
});
