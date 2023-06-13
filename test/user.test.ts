import { describe, after, test } from 'node:test';
import assert from 'node:assert';
import { server, HOST, PORT, endpoint } from './../src/server';
import { type RequestOptions } from 'http';
import { bodyParser, doRequest } from './../src/utils';

const options: RequestOptions = {
  hostname: HOST,
  port: PORT,
  path: endpoint,
  headers: {
    'Content-Type': 'application/json',
  },
  method: 'GET',
};
server.listen(PORT);
describe('API Workflow', () => {
  test('should receive not authorized given wrong user and password', async () => {
    const data = await bodyParser(await doRequest(options));

    console.log('TEST DATA:' + data);

    assert.equal(0, data.length);
  });
  after((done) => server.close(done));
});
