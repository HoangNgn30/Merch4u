import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

const optionalAuth = async (request, response, next) => {
    try {
        const rawToken = request.cookies?.accessToken || request?.headers?.authorization?.split(" ")[1];
        const token = rawToken && !["null", "undefined"].includes(rawToken) ? rawToken : null;

        if (!token) {
            return next();
        }

        const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
        const user = await UserModel.findById(decode.id).select("_id role status accountStatus");

        if (user && user.status === "Active" && (user.accountStatus || "active") === "active") {
            request.userId = user._id;
            request.user = user;
        }
    } catch (error) {
        // Public AI endpoints still work without personalization when auth is absent/expired.
    }

    next();
};

export default optionalAuth;
