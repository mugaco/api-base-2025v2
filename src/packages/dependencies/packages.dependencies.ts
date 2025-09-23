/**
 * Registro de dependencias de packages
 * Incluye repositories, services y controllers de CMS y Media
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

// ========================================
// CMS Package Dependencies
// ========================================

// Publication
import { PublicationRepository } from '@packages/cms/entities/Publication/PublicationRepository';
import { PublicationService } from '@packages/cms/entities/Publication/PublicationService';
import { PublicationController } from '@packages/cms/entities/Publication/PublicationController';

// Category
import { CategoryRepository } from '@packages/cms/entities/Category/CategoryRepository';
import { CategoryService } from '@packages/cms/entities/Category/CategoryService';
import { CategoryController } from '@packages/cms/entities/Category/CategoryController';

// Menu
import { MenuRepository } from '@packages/cms/entities/Menu/MenuRepository';
import { MenuService } from '@packages/cms/entities/Menu/MenuService';
import { MenuController } from '@packages/cms/entities/Menu/MenuController';

// Tag
import { TagRepository } from '@packages/cms/entities/Tag/TagRepository';
import { TagService } from '@packages/cms/entities/Tag/TagService';
import { TagController } from '@packages/cms/entities/Tag/TagController';

// CMS Config
import { CMSConfigController } from '@packages/cms/config/CMSConfigController';

// ========================================
// Media Package Dependencies
// ========================================

// Media
import { MediaRepository } from '@packages/media/entities/Media/MediaRepository';
import { MediaService } from '@packages/media/entities/Media/MediaService';
import { MediaController } from '@packages/media/entities/Media/MediaController';

// Library
import { LibraryRepository } from '@packages/media/entities/Library/LibraryRepository';
import { LibraryService } from '@packages/media/entities/Library/LibraryService';
import { LibraryController } from '@packages/media/entities/Library/LibraryController';

// LibraryTag
import { LibraryTagRepository } from '@packages/media/entities/LibraryTag/LibraryTagRepository';
import { LibraryTagService } from '@packages/media/entities/LibraryTag/LibraryTagService';
import { LibraryTagController } from '@packages/media/entities/LibraryTag/LibraryTagController';

// MediaTag
import { MediaTagRepository } from '@packages/media/entities/MediaTag/MediaTagRepository';
import { MediaTagService } from '@packages/media/entities/MediaTag/MediaTagService';
import { MediaTagController } from '@packages/media/entities/MediaTag/MediaTagController';

/**
 * Registra todas las dependencias relacionadas con packages
 * Organizado por package y entidad para facilitar mantenimiento
 */
export function registerPackagesDependencies(_container: AwilixContainer): void {

  // ========================================
  // CMS Package
  // ========================================

  // Publication
  Container.register('publicationRepository').asClass(PublicationRepository).singleton();
  Container.register('publicationService').asClass(PublicationService).singleton();
  Container.register('publicationController').asClass(PublicationController).singleton();

  // Category
  Container.register('categoryRepository').asClass(CategoryRepository).singleton();
  Container.register('categoryService').asClass(CategoryService).singleton();
  Container.register('categoryController').asClass(CategoryController).singleton();

  // Menu
  Container.register('menuRepository').asClass(MenuRepository).singleton();
  Container.register('menuService').asClass(MenuService).singleton();
  Container.register('menuController').asClass(MenuController).singleton();

  // Tag
  Container.register('tagRepository').asClass(TagRepository).singleton();
  Container.register('tagService').asClass(TagService).singleton();
  Container.register('tagController').asClass(TagController).singleton();

  // CMS Config (no tiene servicio, solo controller)
  Container.register('cmsConfigController').asClass(CMSConfigController).singleton();

  // ========================================
  // Media Package
  // ========================================

  // Media
  Container.register('mediaRepository').asClass(MediaRepository).singleton();
  Container.register('mediaService').asClass(MediaService).singleton();
  Container.register('mediaController').asClass(MediaController).singleton();

  // Library
  Container.register('libraryRepository').asClass(LibraryRepository).singleton();
  Container.register('libraryService').asClass(LibraryService).singleton();
  Container.register('libraryController').asClass(LibraryController).singleton();

  // LibraryTag
  Container.register('libraryTagRepository').asClass(LibraryTagRepository).singleton();
  Container.register('libraryTagService').asClass(LibraryTagService).singleton();
  Container.register('libraryTagController').asClass(LibraryTagController).singleton();

  // MediaTag
  Container.register('mediaTagRepository').asClass(MediaTagRepository).singleton();
  Container.register('mediaTagService').asClass(MediaTagService).singleton();
  Container.register('mediaTagController').asClass(MediaTagController).singleton();
}