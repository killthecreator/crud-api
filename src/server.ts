import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import 'dotenv/config';
import { validate } from 'uuid';
import { usersController } from './controllers';
import { bodyParser, reqBodyCheck, errorChecker, errors, statusCodes, doRequest } from './utils';
import { dbReqOptions, DB_PORT, dbServer } from './db';

export const PORT = Number(process.env.PORT) ?? 4000;
export const HOST = process.env.HOST ?? 'localhost';
export const endpoint = '/api/users';

process.on('SIGINT', () => {
  setImmediate(() => process.exit(0));
});

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method } = req;

  if (process.env.MULTI) {
    const responseFromDb = await doRequest(dbReqOptions('GET'));
    const parsedResponse = await bodyParser(responseFromDb);
    usersController.allUsers = parsedResponse;
  }

  let trimmedUrl = url ?? '';
  while (trimmedUrl.at(-1) === '/') trimmedUrl = trimmedUrl.slice(0, -1);

  res.setHeader('Content-type', 'application/json');
  res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
  let resBody: string | undefined = undefined;

  try {
    if (trimmedUrl === endpoint) {
      switch (method) {
        case 'GET':
          res.statusCode = statusCodes.OK;
          res.end(JSON.stringify(usersController.allUsers));
          break;
        case 'POST':
          console.log(req.headers['content-length']);
          const reqBody = await bodyParser(req);
          reqBodyCheck(res, reqBody);
          res.statusCode = statusCodes.CREATED;
          resBody = JSON.stringify(usersController.createUser(reqBody));
          break;
        default:
          res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
          throw Error(errors.ERR_NO_SUCH_OPERATION);
      }
    } else if (trimmedUrl.startsWith(`${endpoint}/`)) {
      const potentialID = trimmedUrl.replace(endpoint + '/', '');
      if (!validate(potentialID)) {
        res.statusCode = statusCodes.BAD_REQUEST;
        throw Error(errors.ERR_NOT_VALID_UUID(potentialID));
      }
      switch (method) {
        case 'GET':
          try {
            const user = usersController.getUserByID(potentialID);
            res.statusCode = statusCodes.OK;
            resBody = JSON.stringify(user);
          } catch (e) {
            res.statusCode = statusCodes.NOT_FOUND;
            throw e;
          }
          break;
        case 'PUT':
          const reqBody = await bodyParser(req);
          reqBodyCheck(res, reqBody);
          try {
            const updatedUser = usersController.updateUser(reqBody, potentialID);
            res.statusCode = statusCodes.OK;
            resBody = JSON.stringify(updatedUser);
          } catch (e) {
            res.statusCode = statusCodes.NOT_FOUND;
            throw e;
          }
          break;
        case 'DELETE':
          try {
            usersController.deleteUser(potentialID);
            res.statusCode = statusCodes.NO_CONTENT;
          } catch (e) {
            res.statusCode = statusCodes.NOT_FOUND;
            throw e;
          }
          break;
        default:
          res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
          throw Error(errors.ERR_NO_SUCH_OPERATION);
      }
    } else {
      res.statusCode = statusCodes.NOT_FOUND;
      throw Error(errors.ERR_NOT_FOUND);
    }
    if (process.send && process.env.MULTI) process.send(usersController.allUsers);
  } catch (error) {
    resBody = JSON.stringify(errorChecker(error));
  } finally {
    res.end(resBody);
  }
};

export const server = createServer(requestListener);
if (!process.env.MULTI && !process.env.TEST) {
  dbServer.listen(DB_PORT);
  server.listen(PORT, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}
