import type { IncomingMessage } from 'http';

export const bodyParser = async (req: IncomingMessage) => {
  const body = [];
  for await (const chunk of req) body.push(chunk);
  return JSON.parse(Buffer.concat(body).toString());
};
