import { BaseRepository } from '@core/base/BaseRepository';
import { ILibraryTag, LibraryTagModel } from './LibraryTagModel';

/**
 * Repositorio para la entidad LibraryTag heredando de BaseRepository
 */
export class LibraryTagRepository extends BaseRepository<ILibraryTag> {
  constructor() {
    super(LibraryTagModel);
  }
} 