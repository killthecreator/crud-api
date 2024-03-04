import { type IncomingMessage, type RequestOptions, request } from 'http';

export const doRequest = (options: RequestOptions, reqBody?: any): Promise<IncomingMessage> => {
  return new Promise((resolve, reject) => {
    if (reqBody && options.headers) {
      options.headers['Content-length'] = Buffer.byteLength(JSON.stringify(reqBody));
    }
    const req = request(options);

    if (reqBody) req.write(JSON.stringify(reqBody));

    req.on('response', (res) => {
      resolve(res);
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};
