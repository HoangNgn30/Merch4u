import LogoModel from '../models/logo.model.js';
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



//add logo
export async function addLogo(request, response) {
    try {
        const logoUrl = request.body?.logo || request.body?.images?.[0];
        if (!logoUrl) {
            return response.status(400).json({
                message: "Vui lòng tải logo",
                error: true,
                success: false
            });
        }

        let logoItem = new LogoModel({
            logo: logoUrl,
        });

        if (!logoItem) {
            return response.status(500).json({
                message: "Không thể thêm logo",
                error: true,
                success: false
            })
        }

        logoItem = await logoItem.save();

        return response.status(200).json({
            message: "Đã thêm logo",
            error: false,
            success: true,
            logo: logoItem
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}





//get logo
export async function getLogo(request, response) {
    try {
        const logo = await LogoModel.find();

        if (!logo) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }


        return response.status(200).json({
            error: false,
            success: true,
            logo: logo
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getLogoById(request, response) {
    try {
        const logo = await LogoModel.findById(request.params.id);


        if (!logo) {
            return response.status(500)
                .json(
                    {
                        message: "Không tìm thấy logo với mã đã cung cấp.",
                        error: true,
                        success: false
                    }
                );
        }


        return response.status(200).json({
            error: false,
            success: true,
            logo: logo
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function updatedLogo(request, response) {
    const logo = await LogoModel.findByIdAndUpdate(
        request.params.id,
        {
            logo: request.body.logo,
        },
        { new: true }
    );

    if (!logo) {
        return response.status(500).json({
            message: "Không thể cập nhật logo!",
            success: false,
            error: true
        });
    }


    response.status(200).json({
        error: false,
        success: true,
        logo: logo,
        message: "Đã cập nhật logo"
    })

}



export async function removeImageFromCloudinary(request, response) {
  
    const imgUrl = request.query.img;

      
        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];
    
        const imageName = image.split(".")[0];

    
        if (imageName) {
            const res = await cloudinary.uploader.destroy(
                imageName,
                (error, result) => {
                    // console.log(error, res)
                }
            );
    
            if (res) {
                response.status(200).send(res);
            }
        }
}
