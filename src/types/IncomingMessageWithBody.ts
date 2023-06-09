import type { IncomingMessage } from 'http';
import type User from '~/models/user';
export interface IncomingMessageWithBody extends IncomingMessage {
  body?: User;
}
