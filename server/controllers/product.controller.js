import ProductModel from '../models/product.model.js';
import ProductVariantModel from '../models/productVariant.model.js';

import { cloudinary, uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';
// removed unused 'http' import
import { GoogleGenAI } from '@google/genai';

// ─── Gemini Embedding Helper ──────────────────────────────────────────────────
const _genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Tạo vector embedding và lưu vào product.embedding
 * Gọi bất đồng bộ sau khi lưu product — không block response
 */
async function generateAndSaveEmbedding(productId, text) {
    if (!_genAI) return;
    try {
        const result = await _genAI.models.embedContent({
            model: 'gemini-embedding-001',
            contents: [text],
        });
        const embedding = result.embeddings[0].values;
        await ProductModel.findByIdAndUpdate(productId, { embedding });
        console.log(`[Embedding] ✅ Đã tạo embedding cho product ${productId}`);
    } catch (err) {
        // Không throw — chỉ log, tránh làm fail request tạo/sửa sản phẩm
        console.warn(`[Embedding] ⚠️ Không thể tạo embedding cho ${productId}:`, err?.message);
    }
}


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

export async function uploadBannerImages(request, response) {
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


//create product
export async function createProduct(request, response) {
    try {

        let product = new ProductModel({
            name: request.body.name,
            description: request.body.description,
            images: request.body.images || [],
            bannerimages: request.body.bannerimages || [],
            bannerTitleName: request.body.bannerTitleName,
            isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
            brand: request.body.brand,
            price: request.body.price,
            oldPrice: request.body.oldPrice,
            catName: request.body.catName,
            category: request.body.category,
            catId: request.body.catId,
            subCatId: request.body.subCatId,
            subCat: request.body.subCat,
            thirdsubCat: request.body.thirdsubCat,
            thirdsubCatId: request.body.thirdsubCatId,
            countInStock: request.body.countInStock,
            rating: request.body.rating,
            isFeatured: request.body.isFeatured,
            status: request.body.status,
            isNew: request.body.isNew,
            discount: request.body.discount,
            size: request.body.size,
        });

        product = await product.save();


        if (!product) {
            return response.status(500).json({
                error: true,
                success: false,
                message: "Không thể tạo sản phẩm"
            });
        }

        // Tạo embedding bất đồng bộ (không block response)
        const embeddingText = `${product.name}. ${product.description}. Danh mục: ${product.catName}. Brand: ${product.brand}`;
        generateAndSaveEmbedding(product._id, embeddingText);

        return response.status(200).json({
            message: "Đã tạo sản phẩm",
            error: false,
            success: true,
            product: product
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get all products
export async function getAllProducts(request, response) {
    try {

        const { page, limit } = request.query;
        const total = await ProductModel.countDocuments();

        const products = await ProductModel.find().sort({ createdAt: -1 }).populate("category").skip((page - 1) * limit).limit(parseInt(limit));

        if (!products) {
            return response.status(400).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalCount: total
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products by category id
export async function getAllProductsByCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const filter = { catId: request.params.id };
        const totalPosts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages && totalPages > 0) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            catId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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


//get all products by category name
export async function getAllProductsByCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const filter = { catName: request.query.catName };
        const totalPosts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages && totalPages > 0) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            catName: request.query.catName
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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



//get all products by sub category id
export async function getAllProductsBySubCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const filter = { subCatId: request.params.id };
        const totalPosts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages && totalPages > 0) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            subCatId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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


//get all products by sub category name
export async function getAllProductsBySubCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const filter = { subCat: request.query.subCat };
        const totalPosts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages && totalPages > 0) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            subCat: request.query.subCat
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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




//get all products by sub category id
export async function getAllProductsByThirdLavelCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const filter = { thirdsubCatId: request.params.id };
        const totalPosts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages && totalPages > 0) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            thirdsubCatId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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


//get all products by sub category name
export async function getAllProductsByThirdLavelCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const filter = { thirdsubCat: request.query.thirdsubCat };
        const totalPosts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages && totalPages > 0) {
            return response.status(404).json(
                {
                    message: "Không tìm thấy trang",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            thirdsubCat: request.query.thirdsubCat
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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


//get all products by price

export async function getAllProductsByPrice(request, response) {
    try {
        let productList = [];

        if (request.query.catId !== "" && request.query.catId !== undefined) {
            const productListArr = await ProductModel.find({
                catId: request.query.catId,
            }).populate("category");

            productList = productListArr;
        }

        if (request.query.subCatId !== "" && request.query.subCatId !== undefined) {
            const productListArr = await ProductModel.find({
                subCatId: request.query.subCatId,
            }).populate("category");

            productList = productListArr;
        }


        if (request.query.thirdsubCatId !== "" && request.query.thirdsubCatId !== undefined) {
            const productListArr = await ProductModel.find({
                thirdsubCatId: request.query.thirdsubCatId,
            }).populate("category");

            productList = productListArr;
        }



        const filteredProducts = productList.filter((product) => {
            if (request.query.minPrice && product.price < parseInt(+request.query.minPrice)) {
                return false;
            }
            if (request.query.maxPrice && product.price > parseInt(+request.query.maxPrice)) {
                return false;
            }
            return true;
        });

        return response.status(200).json({
            error: false,
            success: true,
            products: filteredProducts,
            totalPages: 0,
            page: 0,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get all products by rating
export async function getAllProductsByRating(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
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


        let products = [];

        if (request.query.catId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                catId: request.query.catId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }

        if (request.query.subCatId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                subCatId: request.query.subCatId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }


        if (request.query.thirdsubCatId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                thirdsubCatId: request.query.thirdsubCatId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }


        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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


//get all products count

export async function getProductsCount(request, response) {
    try {
        const productsCount = await ProductModel.countDocuments();

        if (!productsCount) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            productCount: productsCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get all features products
export async function getAllFeaturedProducts(request, response) {
    try {

        const products = await ProductModel.find({
            isFeatured: true
        }).populate("category");

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all features products have banners
export async function getAllProductsBanners(request, response) {
    try {

        const products = await ProductModel.find({
            isDisplayOnHomeBanner: true
        }).populate("category");

        if (!products) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//delete product
export async function deleteProduct(request, response) {
    try {
        const product = await ProductModel.findById(request.params.id).populate("category");

        if (!product) {
            return response.status(404).json({
                message: "Không tìm thấy sản phẩm",
                error: true,
                success: false
            })
        }

        // Xóa ảnh trên Cloudinary
        for (const img of product.images || []) {
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

        const deletedProduct = await ProductModel.findByIdAndDelete(request.params.id);

        if (!deletedProduct) {
            return response.status(404).json({
                message: "Không thể xóa sản phẩm!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa sản phẩm!",
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
export async function deleteMultipleProduct(request, response) {
    try {
        const { ids } = request.body;

        if (!ids || !Array.isArray(ids)) {
            return response.status(400).json({ error: true, success: false, message: 'Dữ liệu không hợp lệ' });
        }

        for (const id of ids) {
            const product = await ProductModel.findById(id);
            if (!product) continue;

            for (const img of product.images || []) {
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
        }

        await ProductModel.deleteMany({ _id: { $in: ids } });
        return response.status(200).json({
            message: "Đã xóa sản phẩm",
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

//get single product 
export async function getProduct(request, response) {
    try {
        const product = await ProductModel.findById(request.params.id).populate("category");

        if (!product) {
            return response.status(404).json({
                message: "Không tìm thấy sản phẩm",
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            product: product
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//delete images
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


//updated product 
export async function updateProduct(request, response) {
    try {
        const product = await ProductModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
                description: request.body.description,
                bannerimages: request.body.bannerimages,
                bannerTitleName: request.body.bannerTitleName,
                isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
                images: request.body.images,
                brand: request.body.brand,
                price: request.body.price,
                oldPrice: request.body.oldPrice,
                discount: request.body.discount,
                catId: request.body.catId,
                catName: request.body.catName,
                subCat: request.body.subCat,
                subCatId: request.body.subCatId,
                category: request.body.category,
                thirdsubCat: request.body.thirdsubCat,
                thirdsubCatId: request.body.thirdsubCatId,
                countInStock: request.body.countInStock,
                rating: request.body.rating,
                isFeatured: request.body.isFeatured,
                status: request.body.status,
                isNew: request.body.isNew,
                size: request.body.size,
            },
            { new: true }
        );


        if (!product) {
            return response.status(404).json({
                message: "Không thể cập nhật sản phẩm!",
                status: false,
            });
        }

        // Cập nhật embedding nếu tên hoặc mô tả thay đổi
        if (request.body.name || request.body.description) {
            const embeddingText = `${product.name}. ${product.description}. Danh mục: ${product.catName}. Brand: ${product.brand}`;
            generateAndSaveEmbedding(product._id, embeddingText);
        }

        return response.status(200).json({
            message: "Đã cập nhật sản phẩm",
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








export async function createProductVariant(request, response) {
    try {
        let productVariant = new ProductVariantModel({
            name: request.body.name,
            type: request.body.type || 'Size'
        })

        productVariant = await productVariant.save();

        if (!productVariant) {
            return response.status(500).json({
                error: true,
                success: false,
                message: "Không thể tạo biến thể sản phẩm"
            });
        }

        return response.status(200).json({
            message: "Đã tạo biến thể sản phẩm",
            error: false,
            success: true,
            product: productVariant
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteProductVariant(request, response) {
    try {
        const productVariant = await ProductVariantModel.findById(request.params.id);

        if (!productVariant) {
            return response.status(404).json({
                message: "Không tìm thấy mục",
                error: true,
                success: false
            })
        }

        const deletedProductVariant = await ProductVariantModel.findByIdAndDelete(request.params.id);

        if (!deletedProductVariant) {
            return response.status(404).json({
                message: "Không thể xóa mục!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa biến thể sản phẩm!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function updateProductVariant(request, response) {

    try {

        const productVariant = await ProductVariantModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
                type: request.body.type || 'Size'
            },
            { new: true }
        );


        if (!productVariant) {
            return response.status(404).json({
                message: "Không thể cập nhật biến thể sản phẩm!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "Đã cập nhật biến thể sản phẩm",
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


export async function getProductVariant(request, response) {

    try {

        const productVariant = await ProductVariantModel.find();

        if (!productVariant) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productVariant
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductVariantById(request, response) {

    try {

        const productVariant = await ProductVariantModel.findById(request.params.id);

        if (!productVariant) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productVariant
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function filters(request, response) {
    const { catId, subCatId, thirdsubCatId, minPrice, maxPrice, rating, page = 1, limit = 25 } = request.body;

    const filters = {}

    if (catId?.length) {
        filters.catId = { $in: catId }
    }

    if (subCatId?.length) {
        filters.subCatId = { $in: subCatId }
    }

    if (thirdsubCatId?.length) {
        filters.thirdsubCatId = { $in: thirdsubCatId }
    }

    if (minPrice || maxPrice) {
        filters.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
    }

    if (rating?.length) {
        filters.rating = { $in: rating }
    }

    try {

        const products = await ProductModel.find(filters).populate("category").skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));

        const total = await ProductModel.countDocuments(filters);

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }


}


// Sort function
const sortItems = (products, sortBy, order) => {
    return products.sort((a, b) => {
        if (sortBy === 'name') {
            return order === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        }
        if (sortBy === 'price') {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
        }
        return 0; // Default
    });
};


export async function sortBy(request, response) {
    const { products, sortBy, order } = request.body;
    const sortedItems = sortItems([...products], sortBy, order);
    return response.status(200).json({
        error: false,
        success: true,
        products: sortedItems,
        totalPages: 0,
        page: 0,
    });
}




export async function searchProductController(request, response) {
    try {

        const { query, page, limit } = request.body;
        const normalizedQuery = String(query || "").trim().replace(/\s+/g, " ");

        if (!query) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Vui lòng nhập từ khóa tìm kiếm"
            });
        }


        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

        const words = normalizedQuery.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            return response.status(200).json({
                error: false,
                success: true,
                products: [],
                total: 0,
                page: pageNum,
                totalPages: 0
            });
        }

        const escapeRegExp = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const searchQuery = {
            $and: words.map((word) => ({
                name: { $regex: escapeRegExp(word), $options: "i" }
            }))
        };

        const total = await ProductModel.countDocuments(searchQuery);
        const products = await ProductModel.find(searchQuery)
            .populate("category")
            .collation({ locale: "vi", strength: 1 })
            .sort({ name: 1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
