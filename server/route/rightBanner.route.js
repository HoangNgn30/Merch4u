import { Router } from 'express'
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../controllers/rightBanner.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const rightBannerRouter = Router();

rightBannerRouter.post('/uploadImages',auth,authRole('ADMIN'),upload.array('images'),uploadImages);
rightBannerRouter.post('/add',auth,authRole('ADMIN'),addBanner);
rightBannerRouter.get('/',getBanners);
rightBannerRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
rightBannerRouter.get('/:id',getBanner);
rightBannerRouter.delete('/:id',auth,authRole('ADMIN'),deleteBanner);
rightBannerRouter.put('/:id',auth,authRole('ADMIN'),updatedBanner);

export default rightBannerRouter;
