import { BaseService } from '@core/base/BaseService';
import { MediaRepository } from './MediaRepository';
import { IMedia } from './MediaModel';
import { ICreateMedia, IUpdateMedia } from './MediaSchema';
import { IPaginationParams } from '@core/base/interfaces/PaginationParams.interface';
import { IQueryOptions } from '@core/base/interfaces/QueryOptions.interface';
import { IPaginatedResponse } from '@core/base/interfaces/PaginatedResponse.interface';

/**
 * Servicio para la entidad Media heredando de BaseService
 */
export class MediaService extends BaseService<IMedia, IMedia, ICreateMedia, IUpdateMedia> {
  constructor(mediaRepository: MediaRepository) {
    super(mediaRepository);
  }

  /**
   * Método para búsqueda personalizada
   */
  async search(
    searchTerm: string,
    paginationParams: IPaginationParams,
    options?: IQueryOptions
  ): Promise<IPaginatedResponse<IMedia>> {
    // Extraer parámetros de paginación
    const { page = 1, itemsPerPage = 10 } = paginationParams;

    // Construir la consulta de búsqueda
    const query: Record<string, unknown> = {
      $or: [
        // Búsqueda en campos relevantes
        { filename: { $regex: searchTerm, $options: 'i' } },
        { originalFilename: { $regex: searchTerm, $options: 'i' } },
        { mimeType: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };

    // Usar el método findPaginated del BaseService
    return this.findPaginated(query, { page, itemsPerPage }, options);
  }

  /**
   * Obtiene un archivo por su nombre de archivo y el slug de la biblioteca
   * @param filename Nombre del archivo a buscar
   * @param librarySlug Slug de la biblioteca
   * @returns El archivo encontrado o null
   */
  async getByFilenameAndLibrarySlug(filename: string, librarySlug: string): Promise<IMedia | null> {
    let file_name_slug = filename;
    const thumbnail = filename.split('-')[0]
    const isThumbnail = thumbnail === 'thumblg' || thumbnail === 'thumbmd' || thumbnail === 'thumbsm'
    if (isThumbnail) {
      file_name_slug = filename.substring(thumbnail.length + 1); // Remove prefix and dash
    }

    return (this.repository as MediaRepository).findOne({
      filename: file_name_slug,
      library_slug: librarySlug,
      isDeleted: false
    });
  }
  /**
   * 
   * @param query - Filtros de búsqueda
   * @returns Lista de medios que coinciden con los filtros
   */
  getMedias(query: Record<string, unknown>): Promise<IMedia[]> {
    return (this.repository as MediaRepository).findMedias(query);
  }
} 