import HomeSliderModel from '../models/homeSlider.model.js';
import { cloudinary, uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';

// Image upload
export async function uploadImages(request, response) {
    try {
        const images = await uploadFilesToCloudinary(request.files);
        return response.status(200).json({ images });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// Remove image from Cloudinary
export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;
        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split(".")[0];

        if (imageName) {
            await cloudinary.uploader.destroy(imageName);
        }

        return response.status(200).json({
            message: "Đã xóa hình ảnh",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// Add home slide
export async function addHomeSlide(request, response) {
    try {
        const images = Array.isArray(request.body?.images) ? request.body.images : [];
        if (images.length === 0) {
            return response.status(400).json({
                message: "Vui lòng tải ít nhất một ảnh slide",
                error: true,
                success: false
            });
        }

        let slide = new HomeSliderModel({
            images,
        });

        if (!slide) {
            return response.status(500).json({
                message: "Không thể tạo slide",
                error: true,
                success: false
            })
        }

        slide = await slide.save();

        return response.status(200).json({
            message: "Đã tạo slide",
            error: false,
            success: true,
            slide: slide
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// Get all home slides
export async function getHomeSlides(request, response) {
    try {
        const slides = await HomeSliderModel.find();

        if (!slides) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: slides
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// Get single slide
export async function getSlide(request, response) {
    try {
        const slide = await HomeSliderModel.findById(request.params.id);

        if (!slide) {
            return response.status(500).json({
                message: "Không tìm thấy slide với mã đã cung cấp.",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            slide: slide
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// Delete single slide
export async function deleteSlide(request, response) {
    try {
        const slide = await HomeSliderModel.findById(request.params.id);
        if (!slide) {
            return response.status(404).json({
                message: "Không tìm thấy slide!",
                success: false,
                error: true
            });
        }

        const images = slide.images;
        for (const img of images) {
            const urlArr = img.split("/");
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split(".")[0];

            if (imageName) {
                cloudinary.uploader.destroy(imageName, (error, result) => {
                    // console.log(error, result);
                });
            }
        }

        const deletedSlide = await HomeSliderModel.findByIdAndDelete(request.params.id);
        if (!deletedSlide) {
            return response.status(404).json({
                message: "Không tìm thấy slide!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa slide!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// Delete multiple slides
export async function deleteMultipleSlides(request, response) {
    try {
        const { ids } = request.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return response.status(400).json({
                message: "Vui lòng cung cấp danh sách ID cần xóa",
                error: true,
                success: false
            });
        }

        const slides = await HomeSliderModel.find({ _id: { $in: ids } });

        for (const slide of slides) {
            for (const img of slide.images || []) {
                const urlArr = img.split("/");
                const image = urlArr[urlArr.length - 1];
                const imageName = image.split(".")[0];
                if (imageName) {
                    cloudinary.uploader.destroy(imageName, () => {});
                }
            }
        }

        await HomeSliderModel.deleteMany({ _id: { $in: ids } });

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa các slide đã chọn!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}// Update slide
export async function updatedSlide(request, response) {
    try {
        const updateFields = {};
        if (request.body?.images !== undefined) {
            updateFields.images = request.body.images;
        }
        if (request.body?.isVisible !== undefined) {
            updateFields.isVisible = request.body.isVisible;
        }

        const slide = await HomeSliderModel.findByIdAndUpdate(
            request.params.id,
            updateFields,
            { new: true }
        );

        if (!slide) {
            return response.status(500).json({
                message: "Không thể cập nhật slide!",
                success: false,
                error: true
            });
        }

        response.status(200).json({
            error: false,
            success: true,
            slide: slide,
            message: "Đã cập nhật slide"
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
