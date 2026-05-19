import { Router } from 'express'
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addHomeSlide, deleteMultipleSlides, deleteSlide, getHomeSlides, getSlide, removeImageFromCloudinary, updatedSlide, uploadImages } from '../controllers/homeSlider.controller.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/uploadImages',auth,authRole('ADMIN'),upload.array('images'),uploadImages);
homeSlidesRouter.post('/add',auth,authRole('ADMIN'),addHomeSlide);
homeSlidesRouter.get('/',getHomeSlides);
homeSlidesRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
homeSlidesRouter.delete('/deleteMultiple',auth,authRole('ADMIN'),deleteMultipleSlides);
homeSlidesRouter.get('/:id',getSlide);
homeSlidesRouter.delete('/:id',auth,authRole('ADMIN'),deleteSlide);
homeSlidesRouter.put('/:id',auth,authRole('ADMIN'),updatedSlide);


export default homeSlidesRouter;
