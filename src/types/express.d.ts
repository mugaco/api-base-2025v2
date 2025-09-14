import { Container } from 'awilix';
import { IRequestContext } from '../core/interfaces/request-context.interface';
import { IAuthTokenPayload } from '../core/domain/entities/Access/AccessSchema';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthTokenPayload;
      scope?: Container;
      context?: IRequestContext;
    }
  }
}

export {};