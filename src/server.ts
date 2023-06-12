import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import 'dotenv/config';
import { validate } from 'uuid';
import { usersController } from './controllers';
import { bodyParser, isUser, errorChecker, errors, statusCodes } from './utils';

export const PORT = Number(process.env.PORT) ?? 4000;
export const HOST = process.env.HOST ?? 'localhost';
const endpoint = '/api/users';

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method } = req;
  res.setHeader('Content-type', 'application/json');
  res.statusCode = statusCodes.NOT_FOUND;

  const reqBodyCheck = (body: any) => {
    if (!body) throw Error(errors.ERR_NO_REQUEST_BODY);
    if (!isUser(body)) throw Error(errors.ERR_NO_REQUIRED_FIELDS);
    if (body.id) throw Error(errors.ERR_SHOULD_NOT_PROVIDE_ID);
  };

  if (url === endpoint) {
    switch (method) {
      case 'GET':
        res.statusCode = statusCodes.OK;
        res.end(JSON.stringify(usersController.getAllUsers()));
        break;
      case 'POST':
        try {
          const reqBody = await bodyParser(req);
          reqBodyCheck(reqBody);
          res.statusCode = statusCodes.CREATED;
          res.end(JSON.stringify(usersController.createUser(reqBody)));
        } catch (error) {
          res.statusCode = statusCodes.BAD_REQUEST;
          res.end(JSON.stringify(errorChecker(error)));
        }
        break;
      default:
        res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
        res.end(JSON.stringify({ error: errors.ERR_NO_SUCH_OPERATION }));
    }
  } else if (url?.startsWith(`${endpoint}/`)) {
    try {
      const splitUrl = url.split('/');
      const potentialID = splitUrl.at(-1);
      if (!potentialID) {
        res.statusCode = statusCodes.OK;
        res.end(JSON.stringify(usersController.getAllUsers()));
      } else {
        if (!validate(potentialID)) {
          res.statusCode = statusCodes.BAD_REQUEST;
          throw Error(errors.ERR_NOT_VALID_UUID(potentialID));
        }
        switch (method) {
          case 'GET':
            const user = usersController.getUserByID(potentialID);
            res.statusCode = statusCodes.OK;
            res.end(JSON.stringify(user));
            break;
          case 'PUT':
            const reqBody = await bodyParser(req);
            reqBodyCheck(reqBody);
            const updatedUser = usersController.updateUser(reqBody, potentialID);
            res.statusCode = statusCodes.OK;
            res.end(JSON.stringify(updatedUser));
            break;
          case 'DELETE':
            usersController.deleteUser(potentialID);
            res.statusCode = statusCodes.NO_CONTENT;
            res.end();
            break;
          default:
            res.statusCode = statusCodes.INTERNAL_SERVER_ERR;
            res.end(JSON.stringify({ error: errors.ERR_NO_SUCH_OPERATION }));
        }
      }
    } catch (error) {
      res.end(JSON.stringify(errorChecker(error)));
    }
  } else {
    res.end(JSON.stringify({ error: errors.ERR_NOT_FOUND }));
  }
};

export const server = createServer(requestListener);
if (!process.env.MULTI) {
  server.listen(PORT, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}
