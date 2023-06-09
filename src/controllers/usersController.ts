import type User from '~/models/user.js';
import { v4 as uuidv4 } from 'uuid';

class UserController {
  private users: User[];

  constructor() {
    this.users = [
      {
        username: 'leb',
        age: 20,
        hobbies: [],
        id: 'dae07956-d890-4bbb-b9a8-c07b3587d308',
      },
    ];
  }

  getAllUsers() {
    return this.users;
  }

  getUserByID(id: string) {
    const user = this.users.find((user) => user.id === id);
    if (user) return user;
    throw Error(`There is no user with ID ${id}`);
  }
  getUserIndexById(id: string) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) return userIndex;
    throw Error(`There is no user with ID ${id}`);
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
    const userToDelete = this.getUserByID(id);
    this.users = this.users.filter((user) => user === userToDelete);
  }
}

export default new UserController();
