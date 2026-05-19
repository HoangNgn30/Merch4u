import BlogModel from '../models/blog.model.js';
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



//add blog
export async function addBlog(request, response) {
    try {
        let blog = new BlogModel({
            title: request.body.title,
            images: request.body.images || [],
            description: request.body.description,
            author: request.body.author,
            tags: request.body.tags,
            category: request.body.category,
            isPublished: request.body.isPublished !== undefined ? request.body.isPublished : true,
        });

        if (!blog) {
            return response.status(500).json({
                message: "Không thể tạo bài viết",
                error: true,
                success: false
            })
        }

        blog = await blog.save();

        return response.status(200).json({
            message: "Đã tạo bài viết",
            error: false,
            success: true,
            blog: blog
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function getBlogs(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage);


        const totalPosts = await BlogModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }


        const blogs = await BlogModel.find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!blogs) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            blogs: blogs,
            totalPages: totalPages,
            page: page,
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getBlog(request, response) {
    try {
        const blog = await BlogModel.findById(request.params.id);


        if (!blog) {
            return response.status(500)
                .json(
                    {
                        message: "Không tìm thấy bài viết với mã đã cung cấp.",
                        error: true,
                        success: false
                    }
                );
        }


        return response.status(200).json({
            error: false,
            success: true,
            blog: blog
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function deleteBlog(request, response) {
    try {
        const blog = await BlogModel.findById(request.params.id);
        if (!blog) {
            return response.status(404).json({
                message: "Không tìm thấy bài viết!",
                success: false,
                error: true
            });
        }

        const images = blog.images;
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
        const deletedBlog = await BlogModel.findByIdAndDelete(request.params.id);
        if (!deletedBlog) {
            return response.status(404).json({
                message: "Không tìm thấy bài viết!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa bài viết!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function updateBlog(request, response) {
    try {
        const blog = await BlogModel.findByIdAndUpdate(
            request.params.id,
            {
                title: request.body.title,
                description: request.body.description,
                images: request.body.images,
                author: request.body.author,
                tags: request.body.tags,
                category: request.body.category,
                isPublished: request.body.isPublished !== undefined ? request.body.isPublished : true,
            },
            { new: true }
        );

        if (!blog) {
            return response.status(500).json({
                message: "Không thể cập nhật bài viết!",
                success: false,
                error: true
            });
        }

        response.status(200).json({
            error: false,
            success: true,
            blog: blog,
            message: "Đã cập nhật bài viết"
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
