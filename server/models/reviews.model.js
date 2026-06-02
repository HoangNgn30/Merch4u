import mongoose from "mongoose";

const reviewsSchema = new mongoose.Schema({
    image : {
        type : String,
        default : '',
    },
    userName : {
        type : String,
        default : '',
    },
    review : {
        type : String,
        default : '',
    },
    rating : {
        type : Number,
        min: 1,
        max: 5,
        default : 0,
    },
    userId : {
        type : String,
        default : '',
    },
    productId : {
        type : String,
        default : '',
    },
},{
    timestamps : true
});

const ReviewModel = mongoose.model('reviews',reviewsSchema)

export default ReviewModel