import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import genertedRefreshToken from '../utils/generatedRefreshToken.js';

import { cloudinary, uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';
import ReviewModel from '../models/reviews.model.js';

const ROLE_VALUES = ["USER", "ADMIN", "SUPERBOSS"];
const ACCOUNT_STATUS_VALUES = ["pending", "active", "rejected"];

const resolveSelfRegistrationRole = (role) => {
    if (role === "SUPERBOSS") return null;
    if (role === "ADMIN") return "ADMIN";
    return "USER";
}

const getInitialAccountStatus = (role) => role === "ADMIN" ? "pending" : "active";
const PHONE_REGEX = /^0\d{9}$/;
const PHONE_MESSAGE = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0. Ví dụ: 0326851181";
const normalizePhoneForProfile = (mobile) => {
    if (!mobile) return "";
    let cleaned = String(mobile).replace(/[^\d]/g, "").trim();
    if (cleaned.startsWith("+84")) {
        const remainder = cleaned.substring(3);
        cleaned = remainder.startsWith("0") ? remainder : "0" + remainder;
    } else if (cleaned.startsWith("84")) {
        const remainder = cleaned.substring(2);
        cleaned = remainder.startsWith("0") ? remainder : "0" + remainder;
    } else if (cleaned.length === 9 && !cleaned.startsWith("0")) {
        cleaned = "0" + cleaned;
    }
    return cleaned;
};


const buildPublicUserSelect = "-password -refresh_token -access_token -otp -otpExpires";

// --- Firebase ID Token Verification ---
const FIREBASE_PROJECT_ID = "merchshop-725e6";
let _cachedGoogleCerts = null;
let _cachedGoogleCertsExpiry = 0;

async function fetchGooglePublicKeys() {
    if (_cachedGoogleCerts && Date.now() < _cachedGoogleCertsExpiry) {
        return _cachedGoogleCerts;
    }
    const resp = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    if (!resp.ok) throw new Error("Không thể tải public keys của Google");
    const cacheControl = resp.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    _cachedGoogleCertsExpiry = Date.now() + (maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600000);
    _cachedGoogleCerts = await resp.json();
    return _cachedGoogleCerts;
}

async function verifyFirebaseToken(idToken) {
    // Decode header to find kid
    const headerB64 = idToken.split(".")[0];
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const kid = header.kid;
    if (!kid) throw new Error("Token thiếu kid trong header");

    const certs = await fetchGooglePublicKeys();
    const cert = certs[kid];
    if (!cert) throw new Error("Không tìm thấy public key phù hợp");

    const decoded = jwt.verify(idToken, cert, {
        algorithms: ["RS256"],
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
    });
    return decoded;
}

const canDeleteTargetUser = (requester, targetUser) => {
    if (!requester || !targetUser) return false;
    if (String(requester._id) === String(targetUser._id)) return false;
    if (targetUser.role === "SUPERBOSS") return false;
    if (requester.role === "SUPERBOSS") return ["ADMIN", "USER"].includes(targetUser.role);
    if (requester.role === "ADMIN") return targetUser.role === "USER";
    return false;
}


export async function registerUserController(request, response) {
    try {
        let user;

        const { name, email, password, role } = request.body;
        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu",
                error: true,
                success: false
            })
        }

        if (name.length < 3 || name.length > 30) {
            return response.status(400).json({
                message: "Họ và tên phải từ 3 đến 30 ký tự",
                error: true,
                success: false
            });
        }

        if (email.length > 50) {
            return response.status(400).json({
                message: "Email không được vượt quá 50 ký tự",
                error: true,
                success: false
            });
        }

        if (password.length < 6 || password.length > 20) {
            return response.status(400).json({
                message: "Mật khẩu phải từ 6 đến 20 ký tự",
                error: true,
                success: false
            });
        }


        const requestedRole = resolveSelfRegistrationRole(role);

        if (!requestedRole) {
            return response.status(403).json({
                message: "Không thể tạo tài khoản SUPERBOSS từ giao diện",
                error: true,
                success: false
            })
        }

        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!nameRegex.test(name)) {
            return response.status(400).json({
                message: "Họ và tên chỉ được chứa chữ cái",
                error: true,
                success: false
            })
        }

        user = await UserModel.findOne({ email: email });

        if (user) {
            return response.status(409).json({
                message: "Email này đã được đăng ký",
                error: true,
                success: false
            })
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();


        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        user = new UserModel({
            email: email,
            password: hashPassword,
            name: name,
            role: requestedRole,
            accountStatus: getInitialAccountStatus(requestedRole),
            otp: verifyCode,
            otpExpires: Date.now() + 600000,

        });

        await user.save();

        // Send verification email
        const emailSent = await sendEmailFun({
            sendTo: email,
            subject: "Thư xác minh Email từ Merch4u",
            text: "",
            html: VerificationEmail(name, verifyCode)
        });

        if (!emailSent) {
            console.warn(`[DEBUG - SMTP FAILURE] Gửi email xác minh đăng ký thất bại đến ${email}.`);
        }

        if (!emailSent) {
            // Rollback user creation if email fails
            await UserModel.findByIdAndDelete(user._id);
            return response.status(500).json({
                message: "Lỗi hệ thống gửi email. Không thể đăng ký lúc này, vui lòng thử lại sau.",
                error: true,
                success: false
            })
        }


        // Create a JWT token for verification purposes
        const token = jwt.sign(
            { email: user.email, id: user._id },
            process.env.JSON_WEB_TOKEN_SECRET_KEY,
            { expiresIn: '24h' }
        );


        return response.status(200).json({
            success: true,
            error: false,
            message: requestedRole === "ADMIN"
                ? "Tài khoản quản trị đã được đăng ký. Vui lòng xác thực email và chờ SUPERBOSS phê duyệt."
                : "Đăng ký người dùng thành công! ",
            token: token, // Optional: include this if needed for verification
        });



    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function verifyEmailController(request, response) {
    try {
        const { email, otp } = request.body;

        const user = await UserModel.findOne({ email: email });
        if (!user) {
            return response.status(400).json({ error: true, success: false, message: "Không tìm thấy người dùng" });
        }

        const isCodeValid = user.otp === otp;
        const isNotExpired = user.otpExpires > Date.now();

        if (isCodeValid && isNotExpired) {
            user.verify_email = true;
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            return response.status(200).json({ error: false, success: true, message: "Xác thực email thành công" });
        } else if (!isCodeValid) {
            return response.status(400).json({ error: true, success: false, message: "Mã OTP không hợp lệ" });
        } else {
            return response.status(400).json({ error: true, success: false, message: "Mã OTP đã hết hạn" });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function authWithGoogle(request, response) {
    const { idToken, role } = request.body;

    try {
        // --- Xác thực Firebase ID Token ---
        if (!idToken) {
            return response.status(400).json({
                message: "Thiếu mã xác thực Google (idToken)",
                error: true,
                success: false
            })
        }

        let decoded;
        try {
            decoded = await verifyFirebaseToken(idToken);
        } catch (err) {
            console.error("Firebase token verification failed:", err.message);
            return response.status(401).json({
                message: "Xác thực Google không hợp lệ hoặc đã hết hạn",
                error: true,
                success: false
            })
        }

        // Lấy thông tin người dùng an toàn từ token đã xác thực
        const email = decoded.email;
        const name = decoded.name || decoded.email;
        const avatar = decoded.picture || "";
        const mobile = decoded.phone_number || "";

        if (!email) {
            return response.status(400).json({
                message: "Token Google không chứa email",
                error: true,
                success: false
            })
        }

        const existingUser = await UserModel.findOne({ email: email });
        const requestedRole = resolveSelfRegistrationRole(role);

        if (!requestedRole) {
            return response.status(403).json({
                message: "Không thể tạo tài khoản SUPERBOSS từ giao diện",
                error: true,
                success: false
            })
        }

        if (!existingUser) {
            const user = await UserModel.create({
                name: name,
                mobile: normalizePhoneForProfile(mobile),
                email: email,
                password: null,
                avatar: avatar,
                role: requestedRole,
                accountStatus: getInitialAccountStatus(requestedRole),
                verify_email: true,
                signUpWithGoogle: true
            });

            await user.save();

            if (user.accountStatus !== "active") {
                return response.status(201).json({
                    message: "Tài khoản quản trị đã được đăng ký. Vui lòng chờ SUPERBOSS phê duyệt.",
                    error: false,
                    success: true,
                    requiresApproval: true
                })
            }

            const accesstoken = await generatedAccessToken(user._id);
            const refreshToken = await genertedRefreshToken(user._id);

            await UserModel.findByIdAndUpdate(user?._id, {
                last_login_date: new Date()
            })


            const cookiesOption = {
                httpOnly: true,
                secure: true,
                sameSite: "None"
            }
            response.cookie('accessToken', accesstoken, cookiesOption)
            response.cookie('refreshToken', refreshToken, cookiesOption)


            return response.json({
                message: "Đăng nhập thành công",
                error: false,
                success: true,
                data: {
                    accesstoken,
                    refreshToken
                }
            })

        } else {
            if (existingUser.status !== "Active") {
                return response.status(400).json({
                    message: "Vui lòng liên hệ quản trị viên",
                    error: true,
                    success: false
                })
            }

            if ((existingUser.accountStatus || "active") !== "active") {
                return response.status(403).json({
                    message: existingUser.accountStatus === "pending"
                        ? "Tài khoản quản trị đang chờ SUPERBOSS phê duyệt"
                        : "Tài khoản quản trị đã bị từ chối",
                    error: true,
                    success: false
                })
            }

            const accesstoken = await generatedAccessToken(existingUser._id);
            const refreshToken = await genertedRefreshToken(existingUser._id);

            await UserModel.findByIdAndUpdate(existingUser?._id, {
                last_login_date: new Date()
            })


            const cookiesOption = {
                httpOnly: true,
                secure: true,
                sameSite: "None"
            }
            response.cookie('accessToken', accesstoken, cookiesOption)
            response.cookie('refreshToken', refreshToken, cookiesOption)


            return response.json({
                message: "Đăng nhập thành công",
                error: false,
                success: true,
                data: {
                    accesstoken,
                    refreshToken
                }
            })
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }


}


export async function loginUserController(request, response) {
    try {
        const { email, password } = request.body;

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return response.status(400).json({
                message: "Người dùng chưa đăng ký",
                error: true,
                success: false
            })
        }

        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Vui lòng liên hệ quản trị viên",
                error: true,
                success: false
            })
        }

        if ((user.accountStatus || "active") !== "active") {
            return response.status(403).json({
                message: user.accountStatus === "pending"
                    ? "Tài khoản quản trị đang chờ SUPERBOSS phê duyệt"
                    : "Tài khoản quản trị đã bị từ chối",
                error: true,
                success: false
            })
        }

        if (user.verify_email !== true) {
            return response.status(400).json({
                message: "Email của bạn chưa được xác thực, vui lòng xác thực email trước",
                error: true,
                success: false
            })
        }

        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return response.status(400).json({
                message: "Vui lòng kiểm tra lại mật khẩu",
                error: true,
                success: false
            })
        }


        const accesstoken = await generatedAccessToken(user._id);
        const refreshToken = await genertedRefreshToken(user._id);

        const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
            last_login_date: new Date()
        })


        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        response.cookie('accessToken', accesstoken, cookiesOption)
        response.cookie('refreshToken', refreshToken, cookiesOption)


        return response.json({
            message: "Đăng nhập thành công",
            error: false,
            success: true,
            data: {
                accesstoken,
                refreshToken
            }
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}



//logout controller
export async function logoutController(request, response) {
    try {
        const userid = request.userId //middleware

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        response.clearCookie("accessToken", cookiesOption)
        response.clearCookie("refreshToken", cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid, {
            refresh_token: ""
        })

        return response.json({
            message: "Đăng xuất thành công",
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function userAvatarController(request, response) {
    try {
        const userId = request.userId;
        const user = await UserModel.findOne({ _id: userId });

        if (!user) {
            return response.status(500).json({
                message: "Không tìm thấy người dùng",
                error: true,
                success: false
            })
        }

        const uploaded = await uploadFilesToCloudinary(request.files);
        if (!uploaded[0]) {
            return response.status(400).json({
                message: "Vui lòng chọn ảnh đại diện",
                error: true,
                success: false
            });
        }

        if (user.avatar) {
            const urlArr = user.avatar.split("/");
            const avatar_image = urlArr[urlArr.length - 1];
            const imageName = avatar_image.split(".")[0];
            if (imageName) {
                await cloudinary.uploader.destroy(imageName).catch(() => { });
            }
        }

        user.avatar = uploaded[0];
        await user.save();

        return response.status(200).json({
            _id: userId,
            avatar: uploaded[0]
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;
        if (!imgUrl) {
            return response.status(400).json({ message: "Thiếu URL ảnh", error: true, success: false });
        }

        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split(".")[0];

        if (imageName) {
            const res = await cloudinary.uploader.destroy(imageName);
            return response.status(200).json(res);
        }

        return response.status(400).json({ message: "Không thể xác định tên ảnh", error: true, success: false });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

//update user details
export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId //auth middleware
        const { name, email, mobile, password } = request.body;

        const userExist = await UserModel.findById(userId);
        if (!userExist)
            return response.status(400).send('Không thể cập nhật người dùng!');

        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (name && !nameRegex.test(name)) {
            return response.status(400).json({
                message: "Họ và tên chỉ được chứa chữ cái",
                error: true,
                success: false
            })
        }

        if (name && (name.length < 3 || name.length > 30)) {
            return response.status(400).json({
                message: "Họ và tên phải từ 3 đến 30 ký tự",
                error: true,
                success: false
            })
        }

        const normalizedMobile = normalizePhoneForProfile(mobile);
        if (mobile && !PHONE_REGEX.test(normalizedMobile)) {
            return response.status(400).json({
                message: PHONE_MESSAGE,
                error: true,
                success: false
            })
        }

        // Không cho phép đổi email qua endpoint này
        const updateFields = { name: name };
        if (normalizedMobile) {
            updateFields.mobile = normalizedMobile;
        }

        const updateUser = await UserModel.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        )



        return response.json({
            message: "Cập nhật người dùng thành công!",
            error: false,
            success: true,
            user: {
                name: updateUser?.name,
                _id: updateUser?._id,
                email: updateUser?.email,
                mobile: updateUser?.mobile,
                avatar: updateUser?.avatar
            }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//forgot password
export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body

        const user = await UserModel.findOne({ email: email })

        if (!user) {
            return response.status(400).json({
                message: "Email không tồn tại",
                error: true,
                success: false
            })
        }

        else {
            let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

            user.otp = verifyCode;
            user.otpExpires = Date.now() + 600000;

            await user.save();

            const emailSent = await sendEmailFun({
                sendTo: email,
                subject: "Thư gửi mã xác minh OTP từ Merch4u",
                text: "",
                html: VerificationEmail(user.name, verifyCode)
            });

            if (!emailSent) {


                return response.status(500).json({
                    message: "Không thể gửi email OTP, vui lòng thử lại sau.",
                    error: true,
                    success: false
                })
            }

            return response.json({
                message: "Mã OTP đã được gửi thành công, vui lòng kiểm tra email của bạn.",
                error: false,
                success: true
            })

        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                message: "Vui lòng điền đầy đủ thông tin vào trường bắt buộc: email, otp.",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email: email })

        if (!user) {
            return response.status(400).json({
                message: "Email không đúng",
                error: true,
                success: false
            })
        }

        if (otp !== user.otp) {
            return response.status(400).json({
                message: "Mã OTP không hợp lệ",
                error: true,
                success: false
            })
        }


        if (user.otpExpires < Date.now()) {
            return response.status(400).json({
                message: "Mã OTP đã hết hạn",
                error: true,
                success: false
            })
        }


        user.otp = "";
        user.otpExpires = "";

        await user.save();

        // Sinh resetToken ngắn hạn (10 phút) để bảo vệ bước đổi mật khẩu
        const resetToken = jwt.sign(
            { email: user.email, scope: "reset_password" },
            process.env.JSON_WEB_TOKEN_SECRET_KEY,
            { expiresIn: "10m" }
        );

        return response.status(200).json({
            message: "Xác nhận mã OTP thành công!",
            error: false,
            success: true,
            token: resetToken
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}


//reset password
export async function resetpassword(request, response) {
    try {
        const { email, oldPassword, newPassword, confirmPassword } = request.body;
        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Vui lòng điền vào trường bắt buộc: email, Mật khẩu mới, Xác nhận mật khẩu."
            })
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "Email không hợp lệ",
                error: true,
                success: false
            })
        }


        if (user?.signUpWithGoogle === false) {
            const checkPassword = await bcryptjs.compare(oldPassword, user.password);
            if (!checkPassword) {
                return response.status(400).json({
                    message: "Mật khẩu cũ bị sai",
                    error: true,
                    success: false,
                })
            }
        }


        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "Mật khẩu mới và Xác nhận mật khẩu phải giống nhau.",
                error: true,
                success: false,
            })
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(confirmPassword, salt);

        user.password = hashPassword;
        user.signUpWithGoogle = false;
        await user.save();

        return response.json({
            message: "Cập nhật mật khẩu thành công.",
            error: false,
            success: true
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//change password
export async function changePasswordController(request, response) {
    try {
        const { email, newPassword, confirmPassword, token } = request.body;
        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Vui lòng điền vào trường bắt buộc: email, Mật khẩu mới, Xác nhận mật khẩu."
            })
        }

        // Xác thực resetToken để đảm bảo người dùng đã qua bước OTP
        if (!token) {
            return response.status(403).json({
                message: "Phiên xác thực đã hết hạn. Vui lòng thực hiện lại quá trình quên mật khẩu.",
                error: true,
                success: false
            })
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);
        } catch (err) {
            return response.status(403).json({
                message: "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại.",
                error: true,
                success: false
            })
        }

        if (decoded.scope !== "reset_password" || decoded.email !== email) {
            return response.status(403).json({
                message: "Mã xác thực không hợp lệ cho email này.",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "Email không đúng.",
                error: true,
                success: false
            })
        }


        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "Mật khẩu mới và Xác nhận mật khẩu phải giống nhau.",
                error: true,
                success: false,
            })
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(confirmPassword, salt);

        user.password = hashPassword;
        user.signUpWithGoogle = false;
        await user.save();

        return response.json({
            message: "Cập nhật mật khẩu thành công.",
            error: false,
            success: true
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//refresh token controler
export async function refreshToken(request, response) {
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]  /// [ Bearer token]

        if (!refreshToken) {
            return response.status(401).json({
                message: "Token bị sai",
                error: true,
                success: false
            })
        }


        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN)
        if (!verifyToken) {
            return response.status(401).json({
                message: "token hết hạn",
                error: true,
                success: false
            })
        }

        const userId = verifyToken?.id;
        const newAccessToken = await generatedAccessToken(userId)

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        response.cookie('accessToken', newAccessToken, cookiesOption)

        return response.json({
            message: "Token truy cập mới được tạo",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken
            }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get login user details
export async function userDetails(request, response) {
    try {
        const userId = request.userId

        const user = await UserModel.findById(userId).select(buildPublicUserSelect).populate('address_details')

        return response.json({
            message: 'Chi tiết người dùng',
            data: user,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: "Đã xảy ra lỗi",
            error: true,
            success: false
        })
    }
}


//review controller
export async function addReview(request, response) {
    try {
        const userId = request.userId;
        const { review, rating, productId } = request.body;

        // Lấy thông tin người dùng thực tế từ DB để chống giả mạo tên/ảnh
        const user = await UserModel.findById(userId).select("name avatar");
        if (!user) {
            return response.status(404).json({
                message: "Không tìm thấy người dùng",
                error: true,
                success: false
            })
        }

        const userReview = new ReviewModel({
            image: user.avatar || "",
            userName: user.name,
            review: review,
            rating: rating,
            userId: userId,
            productId: productId
        })


        await userReview.save();

        return response.json({
            message: "Thêm đánh giá thành công",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: "Đã xảy ra lỗi",
            error: true,
            success: false
        })
    }
}

//get reviews
export async function getReviews(request, response) {
    try {

        const productId = request.query.productId;


        const reviews = await ReviewModel.find({ productId: productId });

        if (reviews.length === 0) {
            return response.status(200).json({
                error: false,
                success: true,
                reviews: []
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            reviews: reviews
        })

    } catch (error) {
        return response.status(500).json({
            message: "Đã xảy ra lỗi",
            error: true,
            success: false
        })
    }
}




//get all reviews
export async function getAllReviews(request, response) {
    try {

        const reviews = await ReviewModel.find();

        if (reviews.length === 0) {
            return response.status(200).json({
                error: false,
                success: true,
                reviews: []
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            reviews: reviews
        })

    } catch (error) {
        return response.status(500).json({
            message: "Đã xảy ra lỗi",
            error: true,
            success: false
        })
    }
}


//get all users
export async function getAllUsers(request, response) {
    try {
        const { page, limit } = request.query;

        const total = await UserModel.countDocuments();
        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.max(parseInt(limit) || total || 1, 1);

        const users = await UserModel.find()
            .select(buildPublicUserSelect)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        if (!users) {
            return response.status(400).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            users: users,
            total: total,
            page: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            totalUsersCount: total
        })

    } catch (error) {
        return response.status(500).json({
            message: "Đã xảy ra lỗi",
            error: true,
            success: false
        })
    }
}


export async function approveAdminAccount(request, response) {
    try {
        const user = await UserModel.findById(request.params.id);

        if (!user) {
            return response.status(404).json({
                message: "Không tìm thấy người dùng",
                error: true,
                success: false
            })
        }

        if (user.role === "SUPERBOSS") {
            return response.status(400).json({
                message: "Không thể phê duyệt tài khoản SUPERBOSS",
                error: true,
                success: false
            })
        }

        user.role = "ADMIN";
        user.accountStatus = "active";
        user.status = "Active";
        await user.save();

        return response.status(200).json({
            message: "Đã phê duyệt tài khoản quản trị",
            error: false,
            success: true,
            user: await UserModel.findById(user._id).select(buildPublicUserSelect)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function rejectAdminAccount(request, response) {
    try {
        const user = await UserModel.findById(request.params.id);

        if (!user) {
            return response.status(404).json({
                message: "Không tìm thấy người dùng",
                error: true,
                success: false
            })
        }

        if (user.role === "SUPERBOSS") {
            return response.status(400).json({
                message: "Không thể từ chối tài khoản SUPERBOSS",
                error: true,
                success: false
            })
        }

        user.role = user.role === "ADMIN" ? "ADMIN" : "USER";
        user.accountStatus = "rejected";
        await user.save();

        return response.status(200).json({
            message: "Đã từ chối tài khoản quản trị",
            error: false,
            success: true,
            user: await UserModel.findById(user._id).select(buildPublicUserSelect)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function changeUserRole(request, response) {
    try {
        const { role, accountStatus } = request.body;

        if (!ROLE_VALUES.includes(role) || role === "SUPERBOSS") {
            return response.status(400).json({
                message: "Vai trò không hợp lệ",
                error: true,
                success: false
            })
        }

        if (accountStatus && !ACCOUNT_STATUS_VALUES.includes(accountStatus)) {
            return response.status(400).json({
                message: "Trạng thái tài khoản không hợp lệ",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findById(request.params.id);

        if (!user) {
            return response.status(404).json({
                message: "Không tìm thấy người dùng",
                error: true,
                success: false
            })
        }

        if (user.role === "SUPERBOSS") {
            return response.status(403).json({
                message: "Chỉ có thể thay đổi SUPERBOSS trực tiếp trong cơ sở dữ liệu",
                error: true,
                success: false
            })
        }

        user.role = role;
        user.accountStatus = accountStatus || "active";
        await user.save();

        return response.status(200).json({
            message: "Đã cập nhật vai trò người dùng",
            error: false,
            success: true,
            user: await UserModel.findById(user._id).select(buildPublicUserSelect)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteUser(request, response) {
    try {
        const user = await UserModel.findById(request.params.id);

        if (!user) {
            return response.status(404).json({
                message: "Không tìm thấy người dùng",
                error: true,
                success: false
            })
        }

        if (!canDeleteTargetUser(request.user, user)) {
            return response.status(403).json({
                message: "Bạn không có quyền xóa tài khoản này",
                error: true,
                success: false
            })
        }

        const deletedUser = await UserModel.findByIdAndDelete(request.params.id);

        if (!deletedUser) {
            return response.status(404).json({
                message: "Không thể xóa người dùng!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa người dùng!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//delete multiple products
export async function deleteMultiple(request, response) {
    const { ids } = request.body;

    if (!ids || !Array.isArray(ids)) {
        return response.status(400).json({ error: true, success: false, message: 'Dữ liệu không hợp lệ' });
    }


    try {
        const users = await UserModel.find({ _id: { $in: ids } }).select("_id role");

        if (users.length !== ids.length) {
            return response.status(404).json({
                message: "Một hoặc nhiều tài khoản không tồn tại",
                error: true,
                success: false
            })
        }

        const hasForbiddenTarget = users.some((user) => !canDeleteTargetUser(request.user, user));

        if (hasForbiddenTarget) {
            return response.status(403).json({
                message: "Bạn không có quyền xóa một hoặc nhiều tài khoản đã chọn",
                error: true,
                success: false
            })
        }

        await UserModel.deleteMany({ _id: { $in: ids } });
        return response.status(200).json({
            message: "Đã xóa người dùng thành công",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}
