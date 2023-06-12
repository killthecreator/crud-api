import type { User } from '~/models';
import { v4 as uuidv4 } from 'uuid';
import { errors } from './../utils';
import { usersDb } from './../db/usersDb';

class UserController {
  private users: User[];

  constructor(users: User[]) {
    this.users = users;
  }

  get allUsers() {
    return this.users;
  }

  set allUsers(users: User[]) {
    this.users = users;
  }

  getUserByID(id: string) {
    const user = this.users.find((user) => user.id === id);
    if (user) return user;
    throw Error(errors.ERR_NO_USER_WITH_SUCH_ID(id));
  }
  getUserIndexById(id: string) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) return userIndex;
    throw Error(errors.ERR_NO_USER_WITH_SUCH_ID(id));
  }

  createUser(user: Omit<User, 'id'>) {
    const newUser = { ...user, id: uuidv4() };
    this.users.push(newUser);
    return newUser;
  }
  updateUser(user: Omit<User, 'id'>, id: string) {
    const userIndexById = this.getUserIndexById(id);
    this.users[userIndexById] = { ...user, id };
    return this.users[userIndexById];
  }
  deleteUser(id: string) {
    const userIndexToDelete = this.getUserIndexById(id);
    this.users = this.users.filter((user) => user !== this.users[userIndexToDelete]);
  }
}

export const usersController = new UserController(usersDb);
