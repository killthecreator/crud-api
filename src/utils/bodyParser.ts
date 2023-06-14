import type { IncomingMessage } from 'http';
import { errors } from '.';

export const bodyParser = async (req: IncomingMessage) => {
  try {
    const body = [];
    for await (const chunk of req) body.push(chunk);
    return JSON.parse(Buffer.concat(body).toString());
  } catch {
    throw Error(errors.ERR_INCORRECT_REQ_BODY);
  }
};
