import { Router } from "express";
import auth, { authRole } from "../middlewares/auth.js";
import {
    claimRandomCouponController,
    createCouponController,
    deleteCouponController,
    getCouponsController,
    updateCouponController,
    validateCouponController,
    getMinigameStatusController,
    getUserCouponsController,
    deleteUserCouponController,
    useUserCouponController
} from "../controllers/coupon.controller.js";

const couponRouter = Router();

couponRouter.get("/", auth, authRole('ADMIN'), getCouponsController);
couponRouter.post("/create", auth, authRole('ADMIN'), createCouponController);
couponRouter.put("/:id", auth, authRole('ADMIN'), updateCouponController);
couponRouter.delete("/:id", auth, authRole('ADMIN'), deleteCouponController);
couponRouter.post("/validate", auth, validateCouponController);
couponRouter.get("/minigame-status", auth, getMinigameStatusController);
couponRouter.post("/claim-random", auth, claimRandomCouponController);
couponRouter.get("/my-coupons", auth, getUserCouponsController);
couponRouter.delete("/my-coupons/:id", auth, deleteUserCouponController);
couponRouter.post("/use-coupon", auth, useUserCouponController);

export default couponRouter;
