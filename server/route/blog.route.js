import { Router } from 'express'
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { addBlog, deleteBlog, getBlog, getBlogs, updateBlog, uploadImages } from '../controllers/blog.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const blogRouter = Router();

blogRouter.post('/uploadImages',auth,authRole('ADMIN'),upload.array('images'),uploadImages);
blogRouter.post('/add',auth,authRole('ADMIN'),addBlog);
blogRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
blogRouter.get('/',getBlogs);
blogRouter.get('/:id',getBlog);
blogRouter.delete('/:id',auth,authRole('ADMIN'),deleteBlog);
blogRouter.put('/:id',auth,authRole('ADMIN'),updateBlog);

export default blogRouter;
