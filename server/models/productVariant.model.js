import mongoose from 'mongoose';

const productVariantSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Size', 'Color', 'Type', 'Material', 'Other'],
        default: 'Size'
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
},{
    timestamps : true
});

const ProductVariantModel = mongoose.model('ProductVariant',productVariantSchema)

export default ProductVariantModel