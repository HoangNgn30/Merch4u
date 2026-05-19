import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
import bcryptjs from 'bcryptjs';
import UserModel from "./models/user.model.js";

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash("admin123", salt);

    const res1 = await UserModel.updateOne(
        { email: "31thang0@gmail.com" },
        { $set: { password: hashPassword, verify_email: true, status: "Active", accountStatus: "active" } }
    );
    console.log("Updated 31thang0@gmail.com:", res1);

    const res2 = await UserModel.updateOne(
        { email: "viethoang5201314@gmail.com" },
        { $set: { password: hashPassword, verify_email: true, status: "Active", accountStatus: "active" } }
    );
    console.log("Updated viethoang5201314@gmail.com:", res2);

    await mongoose.disconnect();
}
run().catch(console.error);
