import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    images:[
        {
            type:String,
        }
    ],
    title : {
        type : String,
        default : '',
    },
    description : {
        type : String,
        default : '',
    },
    author : {
        type : String,
        default : '',
    },
    tags : [
        {
            type : String,
        }
    ],
    category : {
        type : String,
        default : '',
    },
    isPublished : {
        type : Boolean,
        default : true,
    },
    viewCount : {
        type : Number,
        default : 0,
    },
},{
    timestamps : true
});

const BlogModel = mongoose.model('blog',blogSchema)

export default BlogModel