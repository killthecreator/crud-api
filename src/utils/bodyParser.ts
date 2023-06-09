import type { IncomingMessageWithBody } from '~/types';

export const bodyParser = async (req: IncomingMessageWithBody) =>
  new Promise((resolve, reject) => {
    let body = '';
    req
      .on('error', (err) => {
        console.error(err);
        reject();
      })
      .on('data', (chunk) => (body += chunk))
      .on('end', () => {
        req.body = JSON.parse(body);
        resolve(req.body);
      });
  });
