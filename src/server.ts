import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import usersController from './controllers/usersController';
import { bodyParser, isUser, errorChecker, errors } from './utils';

import { validate } from 'uuid';
import 'dotenv/config';

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST ?? 'localhost';
const endpoint = '/api/users';

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method } = req;
  res.setHeader('Content-type', 'application/json');
  res.statusCode = 404;

  if (url === endpoint) {
    switch (method) {
      case 'GET':
        res.statusCode = 200;
        res.end(JSON.stringify(usersController.getAllUsers()));
        break;
      case 'POST':
        try {
          const body = await bodyParser(req);
          if (!body) throw Error(errors.ERR_NO_REQUEST_BODY);
          if (!isUser(body)) throw Error(errors.ERR_NO_REQUIRED_FIELDS);
          if (body.id) throw Error(errors.ERR_SHOULD_NOT_PROVIDE_ID);
          res.statusCode = 201;
          res.end(JSON.stringify(usersController.createUser(body)));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify(errorChecker(error)));
        }
        break;
      default:
        res.statusCode = 500;
        res.end(JSON.stringify({ error: errors.ERR_NO_SUCH_OPERATION }));
    }
  } else if (url?.startsWith(`${endpoint}/`)) {
    try {
      const splitUrl = url.split('/');
      const potentialID = splitUrl.at(-1);
      if (!potentialID) {
        res.statusCode = 200;
        res.end(JSON.stringify(usersController.getAllUsers()));
      } else {
        if (!validate(potentialID)) {
          res.statusCode = 400;
          throw Error(errors.ERR_NOT_VALID_UUID(potentialID));
        }
        switch (method) {
          case 'GET':
            const user = usersController.getUserByID(potentialID);
            res.statusCode = 200;
            res.end(JSON.stringify(user));
            break;
          case 'PUT':
            const body = await bodyParser(req);
            if (!body) throw Error(errors.ERR_NO_REQUEST_BODY);
            if (!isUser(body)) throw Error(errors.ERR_NO_REQUIRED_FIELDS);
            if (body.id) throw Error(errors.ERR_SHOULD_NOT_PROVIDE_ID);
            const updatedUser = usersController.updateUser(body, potentialID);
            res.statusCode = 200;
            res.end(JSON.stringify(updatedUser));
            break;
          case 'DELETE':
            usersController.deleteUser(potentialID);
            res.statusCode = 204;
            res.end();
            break;
          default:
            res.statusCode = 500;
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
