import type { IncomingMessage } from 'http';
import type { User } from '~/models';
export interface IncomingMessageWithBody extends IncomingMessage {
  body?: User;
}
