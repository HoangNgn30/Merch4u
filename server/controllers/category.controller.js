import CategoryModel from '../models/category.modal.js';
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



//create category
export async function createCategory(request, response) {
    try {
        let category = new CategoryModel({
            name: request.body.name,
            images: request.body.images || [],
            parentId: request.body.parentId,
            parentCatName: request.body.parentCatName,
        });

        if (!category) {
            return response.status(500).json({
                message: "Không thể tạo danh mục",
                error: true,
                success: false
            })
        }

        category = await category.save();

        return response.status(200).json({
            message: "Đã tạo danh mục",
            error: false,
            success: true,
            category: category
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
export async function getCategories(request, response) {
    try {
        const categories = await CategoryModel.find();
        const categoryMap = {};

        categories.forEach(cat => {
            categoryMap[cat._id] = { ...cat._doc, children: [] };
        });

        const rootCategories = [];

        categories.forEach(cat => {
            if (cat.parentId) {
                if (categoryMap[cat.parentId]) {
                    categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
                } else {
                    // Orphan category (parent deleted) — treat as root
                    rootCategories.push(categoryMap[cat._id]);
                }
            } else {
                rootCategories.push(categoryMap[cat._id]);
            }
        });


        return response.status(200).json({
            error: false,
            success: true,
            data: rootCategories
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get category count
export async function getCategoriesCount(request, response) {
    try {
        const categoryCount = await CategoryModel.countDocuments({ parentId: undefined });
        if (!categoryCount) {
            return response.status(500).json({ success: false, error: true });
        }
        else {
            response.send({
                categoryCount: categoryCount,
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get sub category count
export async function getSubCategoriesCount(request, response) {
    try {
        const categories = await CategoryModel.find();
        if (!categories) {
            return response.status(500).json({ success: false, error: true });
        }

        else {
            const subCatList = [];
            for (let cat of categories) {
                if (cat.parentId !== undefined) {
                    subCatList.push(cat);
                }
            }


            response.send({
                SubCategoryCount: subCatList.length,
            });

        }


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get single category
 
export async function getCategory(request, response) {
    try {
        const category = await CategoryModel.findById(request.params.id);


        if (!category) {
            return response.status(500)
                .json(
                    {
                        message: "Không tìm thấy danh mục với mã đã cung cấp.",
                        error: true,
                        success: false
                    }
                );
        }


        return response.status(200).json({
            error: false,
            success: true,
            category: category
        })

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


export async function deleteCategory(request, response) {
    try {
        const category = await CategoryModel.findById(request.params.id);
        if (!category) {
            return response.status(404).json({
                message: "Không tìm thấy danh mục!",
                success: false,
                error: true
            });
        }

        const images = category.images;
        for (const img of images || []) {
            try {
                const urlArr = img.split("/");
                const imageName = urlArr[urlArr.length - 1]?.split(".")[0];
                if (imageName) {
                    await cloudinary.uploader.destroy(imageName);
                }
            } catch (err) {
                console.error("Cloudinary delete error:", err.message);
            }
        }

        const subCategory = await CategoryModel.find({
            parentId: request.params.id
        });

        for (let i = 0; i < subCategory.length; i++) {

            const thirdsubCategory = await CategoryModel.find({
                parentId: subCategory[i]._id
            });

            for (let i = 0; i < thirdsubCategory.length; i++) {
                const deletedThirdSubCat = await CategoryModel.findByIdAndDelete(thirdsubCategory[i]._id);
            }

            const deletedSubCat = await CategoryModel.findByIdAndDelete(subCategory[i]._id);
        }

        const deletedCat = await CategoryModel.findByIdAndDelete(request.params.id);
        if (!deletedCat) {
            return response.status(404).json({
                message: "Không tìm thấy danh mục!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa danh mục!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function updatedCategory(request, response){
    console.log(request.body.name)
    const category = await CategoryModel.findByIdAndUpdate(
        request.params.id,
        {
          name: request.body.name,
          images: request.body.images,
          parentId:request.body.parentId,
          parentCatName: request.body.parentCatName
        },
        { new: true }
      );

      if (!category) {
        return response.status(500).json({
          message: "Không thể cập nhật danh mục!",
          success: false,
          error:true
        });
      }


      response.status(200).json({
        error:false,
        success:true,
        category:category,
        message:"Đã cập nhật danh mục"
      })
    
}
