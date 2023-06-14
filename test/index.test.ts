import { describe, after, it } from 'node:test';
import assert from 'node:assert';
import { server, HOST, PORT, endpoint } from '../src/server';
import { type RequestOptions } from 'http';
import { bodyParser, doRequest, isUser, errors } from '../src/utils';
import { validate } from 'uuid';

const mockUser = { username: 'John', age: 10, hobbies: ['football', 'tennis'] };
const mockToUpdate = { username: 'Jade', age: 20, hobbies: ['theatre', 'ceramics'] };
const options = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', id = ''): RequestOptions => ({
  hostname: HOST,
  port: PORT,
  path: endpoint + '/' + id,
  headers: {
    'Content-Type': 'application/json',
  },
  method,
});
server.listen(PORT);

describe('SCENARIO 1: Successful requests', () => {
  it('Should get empty database', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.equal(responseWithUsers.length, 0);
  });
  it('Should create user and return it in response', async () => {
    const respWithUser = await bodyParser(await doRequest(options('POST'), mockUser));
    assert.equal(isUser(respWithUser), true);
    assert.strictEqual(validate(respWithUser.id), true);
    assert.strictEqual(respWithUser.username, mockUser.username);
    assert.strictEqual(respWithUser.age, mockUser.age);
    assert.deepStrictEqual(respWithUser.hobbies, mockUser.hobbies);
  });
  it('Should get one user', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.strictEqual(responseWithUsers.length, 1);
    assert.equal(isUser(responseWithUsers[0]), true);
    assert.strictEqual(validate(responseWithUsers[0].id), true);
    assert.strictEqual(responseWithUsers[0].username, mockUser.username);
    assert.strictEqual(responseWithUsers[0].age, mockUser.age);
    assert.deepStrictEqual(responseWithUsers[0].hobbies, mockUser.hobbies);
  });
  it('Should update user and return it in response', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    const responseWithUpdatedUser = await bodyParser(
      await doRequest(options('PUT', id), mockToUpdate)
    );
    assert.deepStrictEqual(responseWithUpdatedUser, { ...mockToUpdate, id });
  });
  it('Should delete user', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    await doRequest(options('DELETE', id));
    const newResponseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.equal(newResponseWithUsers.length, 0);
  });
});

describe('SCENARIO 2: Erroneous requests', () => {
  it('Should not create user if the request body is incorrect and respond with corresponding error', async () => {
    const respWithError = await bodyParser(await doRequest(options('POST')));
    console.log(respWithError);
    assert.deepStrictEqual(respWithError, { error: errors.ERR_NO_REQUIRED_FIELDS });
  });
  /* it('Should get one user', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.strictEqual(responseWithUsers.length, 1);
    assert.equal(isUser(responseWithUsers[0]), true);
    assert.strictEqual(validate(responseWithUsers[0].id), true);
    assert.strictEqual(responseWithUsers[0].username, mockUser.username);
    assert.strictEqual(responseWithUsers[0].age, mockUser.age);
    assert.deepStrictEqual(responseWithUsers[0].hobbies, mockUser.hobbies);
  });
  it('Should update user and return it in response', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    const responseWithUpdatedUser = await bodyParser(
      await doRequest(options('PUT', id), mockToUpdate)
    );
    assert.deepStrictEqual(responseWithUpdatedUser, { ...mockToUpdate, id });
  });
  it('Should delete user', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    await doRequest(options('DELETE', id));
    const newResponseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.equal(newResponseWithUsers.length, 0);
  }); */
});

describe('SCENARIO 3: Successful requests', () => {
  /* it('Should get empty database', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.equal(responseWithUsers.length, 0);
  });
  it('Should create user and return it in response', async () => {
    const respWithUser = await bodyParser(await doRequest(options('POST'), mockUser));
    assert.equal(isUser(respWithUser), true);
    assert.strictEqual(validate(respWithUser.id), true);
    assert.strictEqual(respWithUser.username, mockUser.username);
    assert.strictEqual(respWithUser.age, mockUser.age);
    assert.deepStrictEqual(respWithUser.hobbies, mockUser.hobbies);
  });
  it('Should get one user', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.strictEqual(responseWithUsers.length, 1);
    assert.equal(isUser(responseWithUsers[0]), true);
    assert.strictEqual(validate(responseWithUsers[0].id), true);
    assert.strictEqual(responseWithUsers[0].username, mockUser.username);
    assert.strictEqual(responseWithUsers[0].age, mockUser.age);
    assert.deepStrictEqual(responseWithUsers[0].hobbies, mockUser.hobbies);
  });
  it('Should update user and return it in response', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    const responseWithUpdatedUser = await bodyParser(
      await doRequest(options('PUT', id), mockToUpdate)
    );
    assert.deepStrictEqual(responseWithUpdatedUser, { ...mockToUpdate, id });
  });
  it('Should delete user', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    await doRequest(options('DELETE', id));
    const newResponseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.equal(newResponseWithUsers.length, 0);
  }); */
  after((done) => server.close(done));
});
