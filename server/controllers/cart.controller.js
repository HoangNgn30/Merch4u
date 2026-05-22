import CartProductModel from "../models/cartProduct.model.js";

export const addToCartItemController = async (request, response) => {
    try {
        const userId = request.userId //middleware
        const { productTitle, image, rating, price, oldPrice, quantity, subTotal, productId, countInStock, discount, size, weight, ram, brand } = request.body

        if (!productId) {
            return response.status(402).json({
                message: "Vui lòng cung cấp mã sản phẩm",
                error: true,
                success: false
            })
        }

        let normalizedSize = size;
        if (Array.isArray(size)) {
            normalizedSize = size[0] || "";
        }
        let normalizedWeight = weight;
        if (Array.isArray(weight)) {
            normalizedWeight = weight[0] || "";
        }
        let normalizedRam = ram;
        if (Array.isArray(ram)) {
            normalizedRam = ram[0] || "";
        }

        const checkItemCart = await CartProductModel.findOne({
            userId: userId,
            productId: productId,
            size: normalizedSize || "",
            weight: normalizedWeight || "",
            ram: normalizedRam || ""
        })

        if (checkItemCart) {
            const newQty = checkItemCart.quantity + (quantity || 1);
            checkItemCart.quantity = newQty;
            checkItemCart.subTotal = newQty * checkItemCart.price;
            const saved = await checkItemCart.save();
            return response.status(200).json({
                data: saved,
                message: "Đã cộng dồn số lượng sản phẩm vào giỏ hàng",
                error: false,
                success: true
            })
        }


        const cartItem = new CartProductModel({
            productTitle:productTitle,
            image:image,
            rating:rating,
            price:price,
            oldPrice:oldPrice,
            quantity:quantity,
            subTotal:subTotal,
            productId:productId,
            countInStock:countInStock,
            userId:userId,
            brand:brand,
            discount:discount,
            size:normalizedSize || "",
            weight:normalizedWeight || "",
            ram:normalizedRam || ""
        })

        const save = await cartItem.save();


        return response.status(200).json({
            data: save,
            message: "Đã thêm sản phẩm vào giỏ hàng",
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


export const getCartItemController = async (request, response) => {
    try {
        const userId = request.userId;

        const cartItems = await CartProductModel.find({
            userId: userId
        });

        return response.json({
            data: cartItems,
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

export const updateCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId
        const { _id, qty , subTotal, size, weight, ram} = request.body

        if (!_id) {
            return response.status(400).json({
                message: "Vui lòng cung cấp mã giỏ hàng"
            })
        }

        let normalizedSize = size;
        if (Array.isArray(size)) {
            normalizedSize = size[0] || "";
        }
        let normalizedWeight = weight;
        if (Array.isArray(weight)) {
            normalizedWeight = weight[0] || "";
        }
        let normalizedRam = ram;
        if (Array.isArray(ram)) {
            normalizedRam = ram[0] || "";
        }

        const currentItem = await CartProductModel.findOne({ _id: _id, userId: userId });
        if (!currentItem) {
            return response.status(404).json({
                message: "Không tìm thấy sản phẩm trong giỏ hàng",
                error: true,
                success: false
            });
        }

        const targetSize = normalizedSize !== undefined ? normalizedSize : currentItem.size;
        const targetWeight = normalizedWeight !== undefined ? normalizedWeight : currentItem.weight;
        const targetRam = normalizedRam !== undefined ? normalizedRam : currentItem.ram;
        const targetQty = qty !== undefined ? qty : currentItem.quantity;

        // Check if another item with the same product ID and target variants exists
        const duplicateItem = await CartProductModel.findOne({
            _id: { $ne: _id },
            userId: userId,
            productId: currentItem.productId,
            size: targetSize || "",
            weight: targetWeight || "",
            ram: targetRam || ""
        });

        if (duplicateItem) {
            const mergedQty = duplicateItem.quantity + targetQty;
            duplicateItem.quantity = mergedQty;
            duplicateItem.subTotal = mergedQty * duplicateItem.price;
            await duplicateItem.save();

            await CartProductModel.deleteOne({ _id: _id });

            return response.json({
                message: "Đã tự động cộng dồn sản phẩm trùng phiên bản",
                error: false,
                success: true,
                data: duplicateItem,
                merged: true
            });
        }

        currentItem.quantity = targetQty;
        currentItem.size = targetSize || "";
        currentItem.weight = targetWeight || "";
        currentItem.ram = targetRam || "";
        currentItem.subTotal = subTotal !== undefined ? subTotal : (targetQty * currentItem.price);
        const updated = await currentItem.save();

        return response.json({
            message: "Đã cập nhật giỏ hàng",
            error: false,
            success: true,
            data: updated
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const deleteCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId // middleware
        const { id } = request.params


        if(!id){
            return response.status(400).json({
                message : "Provide _id",
                error : true,
                success : false
            })
          }


          const deleteCartItem  = await CartProductModel.deleteOne({_id : id, userId : userId })

          if(!deleteCartItem){
            return response.status(404).json({
                message:"Không tìm thấy sản phẩm trong giỏ hàng",
                error:true,
                success:false
            })
          }
         

          return response.status(200).json({
            message : "Đã xóa sản phẩm khỏi giỏ hàng",
            error : false,
            success : true,
            data : deleteCartItem
          })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export const emptyCartController = async (request, response) => {
    try {
        const userId = request.userId // auth middleware

        await CartProductModel.deleteMany({userId:userId })

          return response.status(200).json({
            error : false,
            success : true,
          })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
