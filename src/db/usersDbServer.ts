import { usersController } from './../controllers';
import { type IncomingMessage, type ServerResponse, type RequestOptions, createServer } from 'http';
import { statusCodes, bodyParser, isUser, errors, errorChecker } from './../utils';
import { HOST } from './../server';
import type { User } from '~/models';

export const DB_PORT = Number(process.env.DB_PORT) ?? 3000;

export const dbServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  let resBody: string | undefined = undefined;
  try {
    switch (req.method) {
      case 'GET':
        const users = usersController.allUsers;
        res.statusCode = statusCodes.OK;
        resBody = JSON.stringify(users);
        break;
      case 'POST':
        const reqBody = await bodyParser(req);
        if (reqBody.length !== 0 && !reqBody.every((item: User) => isUser(item))) {
          throw Error(errors.ERR_DB_ERROR);
        }
        res.statusCode = statusCodes.CREATED;
        usersController.allUsers = reqBody;
        res.end();
        break;
    }
  } catch (error) {
    res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
    resBody = JSON.stringify(errorChecker(error));
  } finally {
    res.end(resBody);
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
