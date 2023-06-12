export const errors = {
  ERR_NO_REQUEST_BODY: 'No request body was provided',
  ERR_NO_REQUIRED_FIELDS: 'Request body does not have required fields or it has unnecessary fields',
  ERR_SHOULD_NOT_PROVIDE_ID: 'You should not provide an ID to use',
  ERR_NO_SUCH_OPERATION: 'There is no such operation for this endpoint',
  ERR_NOT_FOUND: 'Resource not found',
  ERR_NOT_VALID_UUID: (val: string) => `${val} is not valid UUID`,
  ERR_NO_USER_WITH_SUCH_ID: (val: string) => `There is no user with ID ${val}`,
};