import { Router } from 'express'
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import {createProduct, deleteMultipleProduct, deleteProduct, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getAllProductsByThirdLavelCatId, getAllProductsByThirdLavelCatName, getProduct, getProductsCount, updateProduct, uploadImages, createProductVariant, deleteProductVariant, updateProductVariant, getProductVariant, getProductVariantById, uploadBannerImages, getAllProductsBanners, filters, sortBy, searchProductController} from '../controllers/product.controller.js';

import {removeImageFromCloudinary} from '../controllers/category.controller.js';

const productRouter = Router();

productRouter.post('/uploadImages',auth,authRole('ADMIN'),upload.array('images'),uploadImages);
productRouter.post('/uploadBannerImages',auth,authRole('ADMIN'),upload.array('bannerimages'),uploadBannerImages);
productRouter.post('/create',auth,authRole('ADMIN'),createProduct);
productRouter.get('/getAllProducts',getAllProducts);
productRouter.get('/getAllProductsBanners',getAllProductsBanners);
productRouter.get('/getAllProductsByCatId/:id',getAllProductsByCatId);
productRouter.get('/getAllProductsByCatName',getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id',getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName',getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id',getAllProductsByThirdLavelCatId);
productRouter.get('/getAllProductsByThirdLavelCatName',getAllProductsByThirdLavelCatName);
productRouter.get('/getAllProductsByPrice',getAllProductsByPrice);
productRouter.get('/getAllProductsByRating',getAllProductsByRating);
productRouter.get('/getAllProductsCount',getProductsCount);
productRouter.get('/getAllFeaturedProducts',getAllFeaturedProducts);
productRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
productRouter.delete('/deleteMultiple',auth,authRole('ADMIN'),deleteMultipleProduct);
productRouter.delete('/:id',auth,authRole('ADMIN'),deleteProduct);
productRouter.get('/:id',getProduct);
productRouter.put('/updateProduct/:id',auth,authRole('ADMIN'),updateProduct);


productRouter.post('/productVariant/create',auth,authRole('ADMIN'),createProductVariant);
productRouter.delete('/productVariant/:id',auth,authRole('ADMIN'),deleteProductVariant);
productRouter.put('/productVariant/:id',auth,authRole('ADMIN'),updateProductVariant);
productRouter.get('/productVariant/get',getProductVariant);
productRouter.get('/productVariant/:id',getProductVariantById);

productRouter.post('/filters',filters);
productRouter.post('/sortBy',sortBy);
productRouter.post('/search/get',searchProductController);


export default productRouter;
