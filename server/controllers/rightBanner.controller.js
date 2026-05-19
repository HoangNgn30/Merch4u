import RightBannerModel from '../models/rightBanner.model.js';
import { cloudinary, uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';

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



//add banner
export async function addBanner(request, response) {
    try {
        const bannerCount = await RightBannerModel.countDocuments();
        if (bannerCount > 0) {
            return response.status(400).json({
                message: "Banner phải đã tồn tại. Vui lòng chỉnh sửa banner hiện có.",
                error: true,
                success: false
            });
        }

        const images = request.body?.images?.length ? request.body.images : [];
        if (!images[0]) {
            return response.status(400).json({
                message: "Vui lòng tải ảnh banner",
                error: true,
                success: false
            });
        }

        let banner = new RightBannerModel({
            images: [images[0]],
        });

        if (!banner) {
            return response.status(500).json({
                message: "Không thể tạo banner",
                error: true,
                success: false
            })
        }

        banner = await banner.save();

        return response.status(200).json({
            message: "Đã tạo banner",
            error: false,
            success: true,
            banner: banner
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}





//get Categories
export async function getBanners(request, response) {
    try {
        const banners = await RightBannerModel.find();

        if (!banners) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }


        return response.status(200).json({
            error: false,
            success: true,
            data: banners
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get single category

export async function getBanner(request, response) {
    try {
        const banner = await RightBannerModel.findById(request.params.id);


        if (!banner) {
            return response.status(500)
                .json(
                    {
                        message: "Không tìm thấy banner với mã đã cung cấp.",
                        error: true,
                        success: false
                    }
                );
        }


        return response.status(200).json({
            error: false,
            success: true,
            banner: banner
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function deleteBanner(request, response) {
    try {
        const banner = await RightBannerModel.findById(request.params.id);
        if (!banner) {
            return response.status(404).json({
                message: "Không tìm thấy banner!",
                success: false,
                error: true
            });
        }

        const images = banner.images;
        let img = "";
        for (img of images) {
            const imgUrl = img;
            const urlArr = imgUrl.split("/");
            const image = urlArr[urlArr.length - 1];

            const imageName = image.split(".")[0];

            if (imageName) {
                cloudinary.uploader.destroy(imageName, (error, result) => {
                    // console.log(error, result);
                });
            }

        }


        const deletedBanner = await RightBannerModel.findByIdAndDelete(request.params.id);
        if (!deletedBanner) {
            return response.status(404).json({
                message: "Không tìm thấy banner!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa banner!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function updatedBanner(request, response) {
    const banner = await RightBannerModel.findByIdAndUpdate(
        request.params.id,
        {
            images: request.body?.images?.[0] ? [request.body.images[0]] : [],
        },
        { new: true }
    );

    if (!banner) {
        return response.status(500).json({
            message: "Không thể cập nhật banner!",
            success: false,
            error: true
        });
    }


    response.status(200).json({
        error: false,
        success: true,
        banner: banner,
        message: "Đã cập nhật banner"
    })

}
