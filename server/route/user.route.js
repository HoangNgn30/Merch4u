import { Router } from 'express'
import {addReview, approveAdminAccount, authWithGoogle, changePasswordController, changeUserRole, checkPurchaseController, deleteMultiple, deleteUser, forgotPasswordController, getAllReviews, getAllUsers, getReviews, loginUserController, logoutController, refreshToken, registerUserController, rejectAdminAccount, removeImageFromCloudinary, resetpassword, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../controllers/user.controller.js';
import { trackProductView } from '../controllers/userActivity.controller.js';
import auth, { authRole } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';

const userRouter = Router()
userRouter.post('/register',registerUserController)
userRouter.post('/verifyEmail',verifyEmailController)
userRouter.post('/login',loginUserController)
userRouter.post('/authWithGoogle',authWithGoogle)
userRouter.get('/logout',auth,logoutController);
userRouter.put('/user-avatar',auth,upload.array('avatar'),userAvatarController);
userRouter.delete('/deteleImage',auth,authRole('ADMIN'),removeImageFromCloudinary);
userRouter.put('/update-profile',auth,updateUserDetails);
userRouter.post('/forgot-password',forgotPasswordController)
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp)
userRouter.post('/reset-password',auth,resetpassword)
userRouter.post('/forgot-password/change-password',changePasswordController)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/user-details',auth,userDetails);
userRouter.post('/track-view',auth,trackProductView);
userRouter.post('/addReview',auth,addReview);
userRouter.get('/getReviews',getReviews);
userRouter.get('/check-purchase/:productId',auth,checkPurchaseController);
userRouter.get('/getAllReviews',auth,authRole('ADMIN'),getAllReviews);
userRouter.get('/getAllUsers',auth,authRole('ADMIN'),getAllUsers);
userRouter.post('/approve/:id',auth,authRole('SUPERBOSS'),approveAdminAccount);
userRouter.post('/reject/:id',auth,authRole('SUPERBOSS'),rejectAdminAccount);
userRouter.put('/change-role/:id',auth,authRole('SUPERBOSS'),changeUserRole);
userRouter.delete('/deleteMultiple',auth,authRole('ADMIN'),deleteMultiple);
userRouter.delete('/deleteUser/:id',auth,authRole('ADMIN'),deleteUser);


export default userRouter
