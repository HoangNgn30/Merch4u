import mongoose from "mongoose";

const myListSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required:true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    productTitle:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    oldPrice:{
        type:Number,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
},{
    timestamps : true
});

myListSchema.index({ userId: 1, productId: 1 }, { unique: true });

const MyListModel = mongoose.model('MyList',myListSchema)

export default MyListModel