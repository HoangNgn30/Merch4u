import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { ensureUploadsDir } from './utils/cloudinaryUpload.js';
ensureUploadsDir();
import cookieParser from 'cookie-parser'
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDb.js';
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js';
import productRouter from './route/product.route.js';
import cartRouter from './route/cart.route.js';
import myListRouter from './route/mylist.route.js';
import addressRouter from './route/address.route.js';
import homeSlidesRouter from './route/homeSlides.route.js';
import rightBannerRouter from './route/rightBanner.route.js';
import blogRouter from './route/blog.route.js';
import orderRouter from './route/order.route.js';
import logoRouter from './route/logo.route.js';
import aiRouter from './route/ai.route.js';
import couponRouter from './route/coupon.route.js';

const app = express();
const corsOptions = {
    origin: [
        process.env.CLIENT_URL,
        process.env.ADMIN_URL,
        'https://merch4u.vercel.app',
        'https://merch4u-i5ru.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions))


app.use(express.json())
app.use(cookieParser())
// app.use(morgan())
app.use(helmet({
    crossOriginResourcePolicy: false
}))


app.get("/", (request, response) => {
    ///server to client
    response.json({
        message: "Server is running " + process.env.PORT
    })
})


app.get("/api", (request, response) => {
    response.json({
        message: "API is running",
        version: "1.0",
        endpoints: [
            "/api/user",
            "/api/category",
            "/api/product",
            "/api/cart",
            "/api/myList",
            "/api/address",
            "/api/homeSlides",
            "/api/rightBanner",
            "/api/blog",
            "/api/order",
            "/api/logo",
            "/api/ai",
            "/api/coupon"
        ]
    })
})

app.use('/api/user',userRouter)
app.use('/api/category',categoryRouter)
app.use('/api/product',productRouter);
app.use("/api/cart",cartRouter)
app.use("/api/myList",myListRouter)
app.use("/api/address",addressRouter)
app.use("/api/homeSlides",homeSlidesRouter)
app.use("/api/rightBanner",rightBannerRouter)
app.use("/api/blog",blogRouter)
app.use("/api/order",orderRouter)
app.use("/api/logo",logoRouter)
app.use("/api/ai",aiRouter)
app.use("/api/coupon",couponRouter)

// 404 handler — trả về thông tin hữu ích thay vì "Cannot GET"
app.use('/api/*', (request, response) => {
    response.status(404).json({
        error: true,
        success: false,
        message: `Route ${request.method} ${request.originalUrl} not found`,
        availableEndpoints: "/api"
    })
})


connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server is running", process.env.PORT);
    })
})
// Force restart nodemon

