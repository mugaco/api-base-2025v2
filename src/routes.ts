import { Router } from 'express';
import { PruebaRoutes } from '@api/domain/entities/Prueba/PruebaRoutes';
import { TestRoutes } from '@api/domain/entities/Test/TestRoutes';

// Core domain routes
import { UserRoutes } from '@core/domain/entities/User/UserRoutes';
import { AccessRoutes } from '@core/domain/entities/Access/AccessRoutes';
import { AuthRoutes } from '@core/domain/orchestrators/Auth/AuthRoutes';

// CMS routes
import { PublicationRoutes } from '@packages/cms/entities/Publication/PublicationRoutes';
import { PublicationPublicRoutes } from '@packages/cms/entities/Publication/PublicationPublicRoutes';
import { CategoryRoutes } from '@packages/cms/entities/Category/CategoryRoutes';
import { CategoryPublicRoutes } from '@packages/cms/entities/Category/CategoryPublicRoutes';
import { MenuRoutes } from '@packages/cms/entities/Menu/MenuRoutes';
import { MenuPublicRoutes } from '@packages/cms/entities/Menu/MenuPublicRoutes';
import { TagRoutes } from '@packages/cms/entities/Tag/TagRoutes';
import { TagPublicRoutes } from '@packages/cms/entities/Tag/TagPublicRoutes';
import { CMSConfigRoutes } from '@packages/cms/config/CMSConfigRoutes';

// Media routes
import { MediaRoutes } from '@packages/media/entities/Media/MediaRoutes';
import { MediaPublicRoutes } from '@packages/media/entities/Media/MediaPublicRoutes';
import { LibraryRoutes } from '@packages/media/entities/Library/LibraryRoutes';
import { LibraryTagRoutes } from '@packages/media/entities/LibraryTag/LibraryTagRoutes';
import { MediaTagRoutes } from '@packages/media/entities/MediaTag/MediaTagRoutes';

const router = Router();

// Configurar rutas core
router.use('/user', UserRoutes);
router.use('/access', AccessRoutes);
router.use('/auth', AuthRoutes);

// Configurar rutas API
router.use('/prueba', PruebaRoutes);
router.use('/test', TestRoutes);

// Configurar rutas CMS
router.use('/publication', PublicationRoutes);
router.use('/public/publication', PublicationPublicRoutes);
router.use('/category', CategoryRoutes);
router.use('/public/category', CategoryPublicRoutes);
router.use('/menu', MenuRoutes);
router.use('/public/menu', MenuPublicRoutes);
router.use('/tag', TagRoutes);
router.use('/public/tag', TagPublicRoutes);
router.use('/cms-config', CMSConfigRoutes);

// Configurar rutas Media
router.use('/media', MediaRoutes);
router.use('/public/media', MediaPublicRoutes);
router.use('/library', LibraryRoutes);
router.use('/library-tag', LibraryTagRoutes);
router.use('/media-tag', MediaTagRoutes);

export const apiRoutes = router;