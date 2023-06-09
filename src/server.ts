import { createServer, type ServerResponse } from 'http';
import usersController from './controllers/usersController';
import { bodyParser, isUser, errorChecker } from './utils';
import type { IncomingMessageWithBody } from '~/types';
import { validate } from 'uuid';
import 'dotenv/config';

const port = Number(process.env.PORT);
const endpoint = '/api/users';
const requestListener = async (req: IncomingMessageWithBody, res: ServerResponse) => {
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
          await bodyParser(req);
          if (!req.body) throw Error('No request body was provided');
          if (!isUser(req.body))
            throw Error('Request body does not have required fields or it has unnecessary fields');
          if (req.body.id) throw Error('You should not provide an ID to user');
          res.statusCode = 201;
          res.end(JSON.stringify(usersController.createUser(req.body)));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify(errorChecker(error)));
        }
        break;
      default:
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'There is no such operation for this endpoint' }));
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
          throw Error(`${potentialID} is not valid UUID`);
        }
        switch (method) {
          case 'GET':
            const user = usersController.getUserByID(potentialID);
            res.statusCode = 200;
            res.end(JSON.stringify(user));
            break;
          case 'PUT':
            await bodyParser(req);
            if (!req.body) throw Error('No request body was provided');
            if (!isUser(req.body))
              throw Error(
                'Request body does not have required fields or it has unnecessary fields'
              );
            if (req.body.id) throw Error('You should not provide an ID to user');
            const updatedUser = usersController.updateUser(req.body, potentialID);
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
            res.end(JSON.stringify({ error: 'There is no such operation for this endpoint' }));
        }
      }
    } catch (error) {
      res.end(JSON.stringify(errorChecker(error)));
    }
  } else {
    res.end(JSON.stringify({ error: 'Resource not found' }));
  }
};

const server = createServer(requestListener);
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
