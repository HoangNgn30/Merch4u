import CartProductModel from "../models/cartProduct.modal.js";

export const addToCartItemController = async (request, response) => {
    try {
        const userId = request.userId //middleware
        const { productTitle, image, rating, price, oldPrice, quantity, subTotal, productId, countInStock, discount,size, weight, ram, brand } = request.body

        if (!productId) {
            return response.status(402).json({
                message: "Vui lòng cung cấp mã sản phẩm",
                error: true,
                success: false
            })
        }


        const checkItemCart = await CartProductModel.findOne({
            userId: userId,
            productId: productId
        })

        if (checkItemCart) {
            return response.status(400).json({
                message: "Sản phẩm đã có trong giỏ hàng"
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
            size:size,
            weight:weight,
            ram:ram
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

        if (!_id || !qty) {
            return response.status(400).json({
                message: "Vui lòng cung cấp mã giỏ hàng và số lượng"
            })
        }

        const updateCartitem = await CartProductModel.findOneAndUpdate(
            {
                _id: _id,
                userId: userId
            },
            {
                quantity: qty,
                subTotal: subTotal,
                size: size,
                ram: ram,
                weight: weight
            },
            { new: true }
        )

        return response.json({
            message: "Đã cập nhật giỏ hàng",
            error: false,
            success: true,
            data: updateCartitem
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
