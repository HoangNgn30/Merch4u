import 'dotenv/config';
import mongoose from 'mongoose';
import CartProductModel from './models/cartProduct.modal.js';
import OrderModel from './models/order.model.js';
import ProductModel from './models/product.modal.js';
import { createOrderController } from './controllers/order.controller.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ducanh:25102004@cluster0.1snhfyy.mongodb.net/?appName=Cluster0';

async function setupTestData(userId) {
    // 1. Create two temporary mock products in the database
    const productA = new ProductModel({
        name: 'Mock Product A (Selected)',
        description: 'A mock product for testing',
        images: ['http://example.com/a.png'],
        price: 100000,
        countInStock: 50,
        discount: 0,
        bannerimages: ['http://example.com/abanner.png']
    });

    const productB = new ProductModel({
        name: 'Mock Product B (Unselected)',
        description: 'Another mock product for testing',
        images: ['http://example.com/b.png'],
        price: 200000,
        countInStock: 50,
        discount: 0,
        bannerimages: ['http://example.com/bbanner.png']
    });

    const savedProdA = await productA.save();
    const savedProdB = await productB.save();

    console.log(`Saved Product A: ${savedProdA._id}, Product B: ${savedProdB._id}`);

    // 2. Clean existing cart for this user
    await CartProductModel.deleteMany({ userId });

    // 3. Add two different products to cart
    const itemA = new CartProductModel({
        userId,
        productId: savedProdA._id.toString(),
        productTitle: savedProdA.name,
        image: savedProdA.images[0],
        rating: 5,
        price: savedProdA.price,
        quantity: 1,
        subTotal: savedProdA.price,
        countInStock: savedProdA.countInStock
    });

    const itemB = new CartProductModel({
        userId,
        productId: savedProdB._id.toString(),
        productTitle: savedProdB.name,
        image: savedProdB.images[0],
        rating: 4,
        price: savedProdB.price,
        quantity: 2,
        subTotal: savedProdB.price * 2,
        countInStock: savedProdB.countInStock
    });

    const savedCartItemA = await itemA.save();
    const savedCartItemB = await itemB.save();

    console.log(`Saved Cart Item A: ${savedCartItemA._id}, Cart Item B: ${savedCartItemB._id}`);
    return { savedProdA, savedProdB, savedCartItemA, savedCartItemB };
}

async function runCODTest() {
    const userId = '69bc47f93b35d0c11a99c7c8'; // Test user ID
    console.log("Setting up test data for COD...");
    const { savedProdA, savedProdB, savedCartItemA, savedCartItemB } = await setupTestData(userId);

    // Simulate COD request payload where only Product A is selected
    const mockRequest = {
        body: {
            userId,
            products: [
                {
                    productId: savedProdA._id.toString(),
                    productTitle: savedCartItemA.productTitle,
                    quantity: savedCartItemA.quantity,
                    price: savedCartItemA.price,
                    image: savedCartItemA.image,
                    subTotal: savedCartItemA.subTotal,
                    size: savedCartItemA.size || "",
                    weight: savedCartItemA.weight || "",
                    ram: savedCartItemA.ram || "",
                    cartItemId: savedCartItemA._id.toString()
                }
            ],
            paymentId: 'cod_test_payment_id',
            payment_status: 'CASH ON DELIVERY',
            delivery_address: '69bc47f93b35d0c11a99c7c9', // mock address ID
            date: new Date().toLocaleString()
        }
    };

    const mockResponse = {
        status: (code) => {
            console.log(`Response status code: ${code}`);
            return {
                json: (data) => {
                    console.log("Response JSON message:", data.message);
                }
            };
        }
    };

    console.log("Calling createOrderController...");
    try {
        await createOrderController(mockRequest, mockResponse);
    } catch (err) {
        console.error("Error calling createOrderController:", err);
    }

    // Verify database cart state
    console.log("Verifying cart items in DB...");
    const cartItems = await CartProductModel.find({ userId });
    console.log("Remaining cart items count:", cartItems.length);
    for (const item of cartItems) {
        console.log(`Remaining Cart Item: ${item._id}, ProductId: ${item.productId}, Title: ${item.productTitle}`);
    }

    // Clean up temporary products
    console.log("Cleaning up temporary products...");
    await ProductModel.deleteOne({ _id: savedProdA._id });
    await ProductModel.deleteOne({ _id: savedProdB._id });
}

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await runCODTest();

    await mongoose.disconnect();
}

main().catch(console.error);
