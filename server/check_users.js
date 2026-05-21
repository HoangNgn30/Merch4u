import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const UserModel = mongoose.model('User', UserSchema, 'users');

        const users = await UserModel.find({}, 'name email role status accountStatus verify_email signUpWithGoogle');
        console.log("Users in Database:");
        console.log(JSON.stringify(users, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
