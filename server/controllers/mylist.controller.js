import MyListModel from '../models/myList.model.js';

export const addToMyListController = async (request, response) => {
    try {

        const userId = request.userId //middleware
        const {
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount
        } = request.body;


        const item = await MyListModel.findOne({
            userId:userId,
            productId:productId
        })


        if(item){
            return response.status(400).json({
                message: "Sản phẩm đã có trong danh sách yêu thích"
            })
        }

        const myList = new MyListModel({
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount,
            userId
        })


        const save  = await myList.save();

        return response.status(200).json({
            error:false,
            success:true,
            message:"Đã lưu sản phẩm vào danh sách yêu thích",
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const deleteToMyListController = async (request, response) => {
    try {
        const userId = request.userId;
        const deletedItem = await MyListModel.findOneAndDelete({ _id: request.params.id, userId });

        if(!deletedItem){
            return response.status(404).json({
                error:true,
                success:false,
                message:"Không tìm thấy mục hoặc bạn không có quyền xóa"
            })
        }

        return response.status(200).json({
            error:false,
            success:true,
            message:"Đã xóa mục khỏi danh sách yêu thích"
        })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const getMyListController = async (request, response) => {
    try {
        
        const userId = request.userId;

        const myListItems = await MyListModel.find({
            userId:userId
        })

        return response.status(200).json({
            error:false,
            success:true,
            data:myListItems
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
