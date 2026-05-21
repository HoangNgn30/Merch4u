import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    products: [
        {
            productId: {
                type: String
            },
            productTitle: {
                type: String
            },
            quantity: {
                type: Number
            },
            price: {
                type: Number
            },
            image: {
                type: String
            },
            subTotal: {
                type: Number
            },
            cartItemId: {
                type: String
            },
            size: {
                type: String
            }
        }
    ],
    subTotal: {
        type: Number,
        default: 0
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String,
        default: ""
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    paymentId: {
        type: String,
        default: ""
    },
    payment_status : {
        type : String,
        default : ""
    },
    order_status : {
        type : String,
        default : "pending"
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    stockRestoredOnCancel: {
        type: Boolean,
        default: false
    },
    delivery_address: {
        type: mongoose.Schema.ObjectId,
        ref: 'address'
    },
    totalAmt: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel
