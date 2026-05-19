import { Router } from 'express'
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { createCategory, deleteCategory, getCategories, getCategoriesCount, getCategory, getSubCategoriesCount, removeImageFromCloudinary, updatedCategory, uploadImages } from '../controllers/category.controller.js';

const categoryRouter = Router();

categoryRouter.post('/uploadImages',auth,authRole('ADMIN'),upload.array('images'),uploadImages);
categoryRouter.post('/create',auth,authRole('ADMIN'),createCategory);
categoryRouter.get('/',getCategories);
categoryRouter.get('/get/count',getCategoriesCount);
categoryRouter.get('/get/count/subCat',getSubCategoriesCount);
categoryRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
categoryRouter.get('/:id',getCategory);
categoryRouter.delete('/:id',auth,authRole('ADMIN'),deleteCategory);
categoryRouter.put('/:id',auth,authRole('ADMIN'),updatedCategory);


export default categoryRouter;
