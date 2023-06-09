import type User from '~/models/user';

export const isUser = (arg: any): arg is User => {
  return arg &&
    arg.username &&
    typeof arg.username === 'string' &&
    arg.age &&
    typeof arg.age === 'number' &&
    arg.hobbies &&
    Array.isArray(arg.hobbies) &&
    arg.hobbies.every((item: any) => typeof item === 'string') &&
    arg.id
    ? Object.keys(arg).length === 4
    : Object.keys(arg).length === 3;
};