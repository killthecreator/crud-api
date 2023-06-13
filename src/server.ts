import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import 'dotenv/config';
import { validate } from 'uuid';
import { usersController } from './controllers';
import { bodyParser, reqBodyCheck, errorChecker, errors, statusCodes, doRequest } from './utils';
import { dbReqOptions, DB_PORT, dbServer } from './db';

export const PORT = Number(process.env.PORT) ?? 4000;
export const HOST = process.env.HOST ?? 'localhost';
const endpoint = '/api/users';

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method } = req;

  const curDbData = await bodyParser(await doRequest(dbReqOptions('GET')));
  usersController.allUsers = curDbData;

  let trimmedUrl = url ?? '';
  while (trimmedUrl.at(-1) === '/') trimmedUrl = trimmedUrl.slice(0, -1);

  res.setHeader('Content-type', 'application/json');
  res.statusCode = statusCodes.NOT_FOUND;
  let resBody: string | undefined = undefined;

  try {
    if (trimmedUrl === endpoint) {
      switch (method) {
        case 'GET':
          res.statusCode = statusCodes.OK;
          res.end(JSON.stringify(usersController.allUsers));
          break;
        case 'POST':
          req.on('data', (chunk) => console.log(chunk));
          const reqBody = await bodyParser(req);

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
          const user = usersController.getUserByID(potentialID);
          res.statusCode = statusCodes.OK;
          resBody = JSON.stringify(user);
          break;
        case 'PUT':
          const reqBody = await bodyParser(req);
          reqBodyCheck(res, reqBody);
          const updatedUser = usersController.updateUser(reqBody, potentialID);
          res.statusCode = statusCodes.OK;
          resBody = JSON.stringify(updatedUser);
          break;
        case 'DELETE':
          usersController.deleteUser(potentialID);
          res.statusCode = statusCodes.NO_CONTENT;
          break;
        default:
          res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
          throw Error(errors.ERR_NO_SUCH_OPERATION);
      }
    } else {
      throw Error(errors.ERR_NOT_FOUND);
    }
    if (process.send) process.send(usersController.allUsers);
  } catch (error) {
    resBody = JSON.stringify(errorChecker(error));
  } finally {
    res.end(resBody);
  }
};

export const server = createServer(requestListener);
if (!process.env.MULTI) {
  dbServer.listen(DB_PORT);
  server.listen(PORT, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}
