const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure one cart per user
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate total (virtual field)
cartSchema.virtual('total').get(function() {
    return this.items.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
});

// Pre-save middleware to ensure cart validity
cartSchema.pre('save', async function(next) {
    try {
        // Ensure user exists
        const User = mongoose.model('User');
        const userExists = await User.exists({ _id: this.user });
        if (!userExists) {
            throw new Error('Invalid user reference');
        }

        // Validate products exist
        const Product = mongoose.model('Product');
        for (const item of this.items) {
            const productExists = await Product.exists({ _id: item.product });
            if (!productExists) {
                throw new Error(`Invalid product reference: ${item.product}`);
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Static method to get or create cart
cartSchema.statics.getOrCreate = async function(userId) {
    let cart = await this.findOne({ user: userId });
    if (!cart) {
        cart = new this({ user: userId, items: [] });
        await cart.save();
    }
    return cart;
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart; 