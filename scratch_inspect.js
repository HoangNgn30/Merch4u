import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://ducanh:25102004@cluster0.1snhfyy.mongodb.net/?appName=Cluster0';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Fetch the latest 5 orders
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    const cartsCollection = db.collection('carts');

    const latestOrders = await ordersCollection.find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log("--- LATEST ORDERS ---");
    for (const order of latestOrders) {
        console.log(`Order ID: ${order._id}, User ID: ${order.userId}, Total: ${order.totalAmt}, Status: ${order.payment_status}`);
        console.log("Products:");
        for (const prod of order.products || []) {
            console.log(`  - ProductId: ${prod.productId}, Title: ${prod.productTitle}, Size: ${prod.size}, cartItemId: ${prod.cartItemId}`);
        }
    }

    const allCarts = await cartsCollection.find().toArray();
    console.log("--- ALL CART ITEMS ---");
    for (const cart of allCarts) {
        console.log(`Cart ID: ${cart._id}, User: ${cart.userId}, ProductId: ${cart.productId}, Title: ${cart.productTitle}, Qty: ${cart.quantity}`);
    }

    await mongoose.disconnect();
}

main().catch(console.error);
