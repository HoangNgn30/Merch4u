import { Router } from 'express'
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addLogo, getLogo, getLogoById, removeImageFromCloudinary, updatedLogo, uploadImages } from '../controllers/logo.controller.js';

const logoRouter = Router();

logoRouter.post('/uploadImages',auth,authRole('ADMIN'),upload.array('images'),uploadImages);
logoRouter.post('/add',auth,authRole('ADMIN'),addLogo);
logoRouter.get('/',getLogo);
logoRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
logoRouter.get('/:id',getLogoById);
logoRouter.put('/:id',auth,authRole('ADMIN'),updatedLogo);

export default logoRouter;
