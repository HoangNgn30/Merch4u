import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../controllers/rightBanner.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const rightBannerRouter = Router();

rightBannerRouter.post('/uploadImages',auth,upload.array('images'),uploadImages);
rightBannerRouter.post('/add',auth,addBanner);
rightBannerRouter.get('/',getBanners);
rightBannerRouter.get('/:id',getBanner);
rightBannerRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
rightBannerRouter.delete('/:id',auth,deleteBanner);
rightBannerRouter.put('/:id',auth,updatedBanner);

export default rightBannerRouter;