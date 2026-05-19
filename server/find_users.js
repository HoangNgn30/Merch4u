import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
import UserModel from "./models/user.model.js";

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await UserModel.find({ role: { $in: ["ADMIN", "SUPERBOSS"] } }, "name email role accountStatus");
    console.log("Users:", users);
    await mongoose.disconnect();
}
run().catch(console.error);
