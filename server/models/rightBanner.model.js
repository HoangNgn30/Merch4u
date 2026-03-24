import mongoose from "mongoose";

const RightBannerSchema = new mongoose.Schema({

    images:[
        {
            type:String,
        }
    ],

},{
    timestamps : true
})


const RightBannerModel = mongoose.model('rightBanner',RightBannerSchema)

export default RightBannerModel