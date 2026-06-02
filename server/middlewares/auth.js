import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model.js'

const auth = async(request,response,next)=>{
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1];

        // if(!token){
        //    token = request.query.token; 
        // }

        if(!token){
            return response.status(401).json({
                message : "Provide token"
            })
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return response.status(401).json({
                message : "unauthorized access",
                error : true,
                success : false
            })
        }

        request.userId = decode.id
        const user = await UserModel.findById(decode.id).select('_id role status accountStatus');

        if (!user) {
            return response.status(401).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        if (user.status !== "Active") {
            return response.status(403).json({
                message: "Account is not active",
                error: true,
                success: false
            })
        }

        const accountStatus = user.accountStatus || "active";

        if (accountStatus !== "active") {
            return response.status(403).json({
                message: accountStatus === "pending"
                    ? "Tài khoản đang chờ SUPERBOSS duyệt"
                    : "Tài khoản đã bị từ chối",
                error: true,
                success: false
            })
        }

        request.user = user

        next()

    } catch (error) {
        return response.status(401).json({
            message : "You have not login",///error.message || error,
            error : true,
            success : false
        })
    }
}

export const authRole = (...allowedRoles) => {
    return (request, response, next) => {
        const role = request.user?.role;

        if (!role) {
            return response.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            })
        }

        const canAccess = allowedRoles.includes(role) || (role === "SUPERBOSS" && allowedRoles.includes("ADMIN"));

        if (!canAccess) {
            return response.status(403).json({
                message: "Bạn không có quyền truy cập chức năng này",
                error: true,
                success: false
            })
        }

        next();
    }
}

export default auth
