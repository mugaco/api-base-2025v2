import { BaseRepository } from '@core/base/BaseRepository';
import { IMedia, MediaModel } from './MediaModel';

/**
 * Repositorio para la entidad Media heredando de BaseRepository
 */
export class MediaRepository extends BaseRepository<IMedia> {
  constructor() {
    super(MediaModel);
  }
} 