import { usersController } from './../controllers';
import { type IncomingMessage, type ServerResponse, type RequestOptions, createServer } from 'http';
import { statusCodes, bodyParser, isUser, errors } from './../utils';
import { HOST } from './../server';
import type { User } from '~/models';

export const DB_PORT = Number(process.env.DB_PORT) ?? 3000;

export const dbServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    switch (req.method) {
      case 'GET':
        const users = usersController.allUsers;

        res.statusCode = statusCodes.OK;
        res.end(JSON.stringify(users));
        break;
      case 'POST':
        const reqBody = await bodyParser(req);
        if (reqBody.length !== 0 && !reqBody.every((item: User) => isUser(item))) {
          throw Error();
        }
        res.statusCode = statusCodes.CREATED;
        usersController.allUsers = reqBody;
        res.end();
        break;
    }
  } catch {
    res.statusCode = statusCodes.BAD_REQUEST;
    res.end(JSON.stringify({ error: errors.ERR_NO_REQUIRED_FIELDS }));
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
