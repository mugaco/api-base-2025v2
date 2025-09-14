import { Container } from 'awilix';
import { IRequestContext } from '../core/interfaces/request-context.interface';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        name: string;
        role: string;
      };
      scope?: Container;
      context?: IRequestContext;
    }
  }
}

export {};