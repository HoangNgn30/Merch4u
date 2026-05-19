import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";

const PHONE_REGEX = /^0\d{9}$/;
const PHONE_MESSAGE = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0. Ví dụ: 0326851181";

const normalizeMobile = (mobile) => String(mobile || "").trim();

export const addAddressController = async (request, response) => {
    try {
        const {
            address_line1,
            city,
            state,
            pincode,
            country,
            mobile,
            userId,
            landmark,
            addressType,
        } = request.body;

        const normalizedMobile = normalizeMobile(mobile);

        if (!PHONE_REGEX.test(normalizedMobile)) {
            return response.status(400).json({
                message: PHONE_MESSAGE,
                error: true,
                success: false,
            });
        }

        const address = new AddressModel({
            address_line1,
            city,
            state,
            pincode,
            country,
            mobile: normalizedMobile,
            userId,
            landmark,
            addressType,
        });

        const savedAddress = await address.save();

        await UserModel.updateOne(
            { _id: userId },
            {
                $addToSet: {
                    address_details: savedAddress?._id,
                },
            }
        );

        return response.status(200).json({
            data: savedAddress,
            message: "Thêm địa chỉ thành công",
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export const getAddressController = async (request, response) => {
    try {
        const address = await AddressModel.find({ userId: request?.query?.userId });

        if (!address) {
            return response.status(404).json({
                error: true,
                success: false,
                message: "Không tìm thấy địa chỉ",
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: address,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export const deleteAddressController = async (request, response) => {
    try {
        const userId = request.userId;
        const _id = request.params.id;

        if (!_id) {
            return response.status(400).json({
                message: "Vui lòng cung cấp mã địa chỉ",
                error: true,
                success: false,
            });
        }

        const deleteItem = await AddressModel.deleteOne({ _id, userId });

        if (!deleteItem || deleteItem.deletedCount === 0) {
            return response.status(404).json({
                message: "Không tìm thấy địa chỉ trong hệ thống",
                error: true,
                success: false,
            });
        }

        await UserModel.updateOne(
            { _id: userId },
            { $pull: { address_details: _id } }
        );

        return response.json({
            message: "Đã xóa địa chỉ",
            error: false,
            success: true,
            data: deleteItem,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export const getSingleAddressController = async (request, response) => {
    try {
        const id = request.params.id;
        const address = await AddressModel.findOne({ _id: id });

        if (!address) {
            return response.status(404).json({
                message: "Không tìm thấy địa chỉ",
                error: true,
                success: false,
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            address,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export async function editAddress(request, response) {
    try {
        const id = request.params.id;
        const {
            address_line1,
            city,
            state,
            pincode,
            country,
            mobile,
            landmark,
            addressType,
        } = request.body;

        const normalizedMobile = normalizeMobile(mobile);

        if (!PHONE_REGEX.test(normalizedMobile)) {
            return response.status(400).json({
                message: PHONE_MESSAGE,
                error: true,
                success: false,
            });
        }

        const address = await AddressModel.findByIdAndUpdate(
            id,
            {
                address_line1,
                city,
                state,
                pincode,
                country,
                mobile: normalizedMobile,
                landmark,
                addressType,
            },
            { new: true }
        );

        return response.json({
            message: "Cập nhật địa chỉ thành công",
            error: false,
            success: true,
            address,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}
