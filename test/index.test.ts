import { describe, after, it } from 'node:test';
import assert from 'node:assert';
import { server, HOST, PORT, endpoint } from '../src/server';
import { type RequestOptions } from 'http';
import { bodyParser, doRequest, isUser, errors, statusCodes } from '../src/utils';
import { v4 as uuidv4, validate } from 'uuid';

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
  it('Should delete a user (DB should be now empty)', async () => {
    const responseWithUsers = await bodyParser(await doRequest(options('GET')));
    const id = responseWithUsers[0].id;
    await doRequest(options('DELETE', id));
    const newResponseWithUsers = await bodyParser(await doRequest(options('GET')));
    assert.equal(newResponseWithUsers.length, 0);
  });
});

describe('SCENARIO 2: Erroneous requests', () => {
  it('Should not create user if the request body is incorrect and respond with corresponding error', async () => {
    const respWithError = await doRequest(options('POST'), {});
    const parsedResp = await bodyParser(respWithError);
    assert.strictEqual(respWithError.statusCode, statusCodes.BAD_REQUEST);
    assert.deepStrictEqual(parsedResp, { error: errors.ERR_NO_REQUIRED_FIELDS });
  });
  it('Should return a corresponding error if trying to get user via incorrect uuid', async () => {
    const mockId = uuidv4().slice(0, -1);
    const respWithError = await doRequest(options('GET', mockId));
    const parsedResp = await bodyParser(respWithError);
    assert.strictEqual(respWithError.statusCode, statusCodes.BAD_REQUEST);
    assert.deepStrictEqual(parsedResp, { error: errors.ERR_NOT_VALID_UUID(mockId) });
  });
  it('Should return a corresponding error if trying to get user with non-existing uuid', async () => {
    const mockId = uuidv4();
    const respWithError = await doRequest(options('GET', mockId));
    const parsedResp = await bodyParser(respWithError);
    assert.strictEqual(respWithError.statusCode, statusCodes.NOT_FOUND);
    assert.deepStrictEqual(parsedResp, { error: errors.ERR_NO_USER_WITH_SUCH_ID(mockId) });
  });
  it('Should return a cooresponding error if there is no such operation on an endpoint', async () => {
    const respWithError = await doRequest(options('PUT'));
    const parsedResp = await bodyParser(respWithError);
    assert.strictEqual(respWithError.statusCode, statusCodes.INTERNAL_SERVER_ERR);
    assert.deepStrictEqual(parsedResp, { error: errors.ERR_NO_SUCH_OPERATION });
  });
});

describe('SCENARIO 3: Successful/Erroneous requests', () => {
  it('Should create a user then delete a user and then get an error when trying to get this user by Id', async () => {
    const respWithPostedUser = await bodyParser(await doRequest(options('POST'), mockUser));
    const { id } = respWithPostedUser;
    assert.equal(isUser(respWithPostedUser), true);
    assert.strictEqual(validate(id), true);
    assert.strictEqual(respWithPostedUser.username, mockUser.username);
    assert.strictEqual(respWithPostedUser.age, mockUser.age);
    assert.deepStrictEqual(respWithPostedUser.hobbies, mockUser.hobbies);
    await doRequest(options('DELETE', id));
    const respWithError = await doRequest(options('GET', id));
    const parsedResp = await bodyParser(respWithError);
    assert.strictEqual(respWithError.statusCode, statusCodes.NOT_FOUND);
    assert.deepStrictEqual(parsedResp, { error: errors.ERR_NO_USER_WITH_SUCH_ID(id) });
  });
  it('Should create a user then update a user and then getting updated user and assert that data is not equal to initial', async () => {
    const respWithPostedUser = await bodyParser(await doRequest(options('POST'), mockUser));
    const { id } = respWithPostedUser;
    assert.equal(isUser(respWithPostedUser), true);
    assert.strictEqual(validate(id), true);
    assert.strictEqual(respWithPostedUser.username, mockUser.username);
    assert.strictEqual(respWithPostedUser.age, mockUser.age);
    assert.deepStrictEqual(respWithPostedUser.hobbies, mockUser.hobbies);
    await doRequest(options('PUT', id), mockToUpdate);
    const respWithUser = await doRequest(options('GET', id));
    const parsedResp = await bodyParser(respWithUser);
    assert.notStrictEqual(parsedResp.username, mockUser.username);
    assert.notStrictEqual(parsedResp.age, mockUser.age);
    assert.notDeepStrictEqual(parsedResp.hobbies, mockUser.hobbies);
  });
  after((done) => server.close(done));
});
