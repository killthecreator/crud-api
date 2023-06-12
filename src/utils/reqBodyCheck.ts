import { isUser, statusCodes, errors } from '.';
import type { ServerResponse } from 'http';

export const reqBodyCheck = (res: ServerResponse, body: any) => {
  if (!isUser(body) || body.id) {
    res.statusCode = statusCodes.BAD_REQUEST;
    if (body.id) throw Error(errors.ERR_SHOULD_NOT_PROVIDE_ID);
    else throw Error(errors.ERR_NO_REQUIRED_FIELDS);
  }
};
