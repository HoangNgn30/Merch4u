import { Router } from "express";
import auth, { authRole } from "../middlewares/auth.js";
import {  captureOrderPaypalController, 
    createOrderController, 
    createOrderPaypalController, 
    deleteOrder, 
    getOrderDetailsController, 
    getTotalOrdersCountController, 
    getUserOrderDetailsController, 
    totalSalesController, 
    totalUsersController, 
    updateOrderStatusController, 
    createOrderPayosController,
    cancelOrderController,
    cancelOrderByCodeController,
    receivePayosWebhookController,
    verifyPayosPaymentController,
    getDeliveredChartsData 
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post('/create',auth,createOrderController)
orderRouter.get("/order-list",auth,authRole('ADMIN'),getOrderDetailsController)
orderRouter.post('/create-order-paypal',auth,createOrderPaypalController)
orderRouter.post('/capture-order-paypal',auth,captureOrderPaypalController)


orderRouter.post('/create-order-payos', auth, createOrderPayosController)
orderRouter.post('/payos-webhook', receivePayosWebhookController)
orderRouter.get('/verify-payos/:orderCode', auth, verifyPayosPaymentController)
orderRouter.put('/cancel-by-code/:orderCode', auth, cancelOrderByCodeController)


orderRouter.put('/order-status/:id',auth,authRole('ADMIN'),updateOrderStatusController)
orderRouter.put('/cancel/:id',auth,cancelOrderController)
orderRouter.get('/count',auth,authRole('ADMIN'),getTotalOrdersCountController)
orderRouter.get('/sales',auth,authRole('ADMIN'),totalSalesController)
orderRouter.get('/users',auth,authRole('ADMIN'),totalUsersController)
orderRouter.get('/order-list/orders',auth,getUserOrderDetailsController)
orderRouter.delete('/deleteOrder/:id',auth,authRole('ADMIN'),deleteOrder)
orderRouter.get('/delivered-charts-data',auth,authRole('ADMIN'),getDeliveredChartsData)

export default orderRouter;
