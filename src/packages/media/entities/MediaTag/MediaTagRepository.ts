import { BaseRepository } from '@core/base/BaseRepository';
import { IMediaTag, MediaTagModel } from './MediaTagModel';

/**
 * Repositorio para la entidad MediaTag heredando de BaseRepository
 */
export class MediaTagRepository extends BaseRepository<IMediaTag> {
  constructor() {
    super(MediaTagModel);
  }
} 