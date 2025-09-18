import { BaseRepository } from '@core/base/BaseRepository';
import { ILibrary, LibraryModel } from './LibraryModel';

/**
 * Repositorio para la entidad Library heredando de BaseRepository
 */
export class LibraryRepository extends BaseRepository<ILibrary> {
  constructor() {
    super(LibraryModel);
  }
}