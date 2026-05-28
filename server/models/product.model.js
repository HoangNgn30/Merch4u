import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    images: [
        {
            type: String,
            required: true
        }
    ],
    brand: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    oldPrice: {
        type: Number,
        default: 0
    },
    catName:{
        type:String,
        default:''
    },
    catId:{
        type:String,
        default:''
    },
    subCatId:{
        type:String,
        default:''
    },
    subCat:{
        type:String,
        default:''
    },
    thirdsubCat:{
        type:String,
        default:''
    },
    thirdsubCatId:{
        type:String,
        default:''
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    countInStock: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['available', 'pre-order', 'exclusive', 'sold-out'],
        default: 'available',
    },
    isNew: {
        type: Boolean,
        default: false,
    },
    discount: {
        type: Number,
        required: true,
    },
    sale: {
        type: Number,
        default:0
    },
    size: [
        {
            type: String,
            default: null,
        }
    ],
    bannerimages: [
        {
            type: String,
            required: true
        }
    ],
    bannerTitleName: {
        type: String,
        default: '',
    },
    isDisplayOnHomeBanner: {
        type: Boolean,
        default: false,
    },
    // Vector embedding (Gemini gemini-embedding-001, 3072 dims)
    // select: false => không bao giờ trả về trong query thông thường
    embedding: {
        type: [Number],
        select: false,
        default: undefined,
    },
},{
    timestamps : true,
    suppressReservedKeysWarning: true
});


productSchema.index({ catId: 1 });
productSchema.index({ subCatId: 1 });
productSchema.index({ thirdsubCatId: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isDisplayOnHomeBanner: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: 1 });

const ProductModel = mongoose.model('Product',productSchema)

export default ProductModel
