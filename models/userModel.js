const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Cart schema
const cartItemSchema = new mongoose.Schema({
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
}); // Enable _id for cart items (remove { _id: false })

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    googleId: {
        type: String,
        sparse: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password only required for non-Google users
        }
    },
    phone: {
        type: String,
        required: function() {
            return this.isSetupComplete; // Only required after setup is complete
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    activationToken: String,
    activationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    addresses: [{
        street: String,
        ward: String,
        district: String,
        city: String,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    avatar: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    cart: [cartItemSchema],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isSetupComplete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Calculate cart total
userSchema.virtual('cartTotal').get(function() {
    return this.cart.reduce((total, item) => {
        if (item.product?.price) {
            return total + (item.product.price * item.quantity);
        }
        return total;
    }, 0);
});

// Cart methods
userSchema.methods.addToCart = async function(productId, quantity = 1) {
    const existingItem = this.cart.find(item => 
        item.product.toString() === productId.toString()
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // Create new cart item with auto-generated _id
        this.cart.push({ product: productId, quantity });
    }

    return this.save();
};

userSchema.methods.removeFromCart = async function(itemId) {
    try {
        console.log('Removing cart item with ID:', itemId);
        
        // Find and remove the specific cart item by its _id
        const itemIndex = this.cart.findIndex(item => 
            item._id.toString() === itemId
        );

        if (itemIndex > -1) {
            // Remove the specific item
            this.cart.splice(itemIndex, 1);
            console.log('Item removed, new cart length:', this.cart.length);
            await this.save();
            return true;
        }

        console.log('Cart item not found');
        return false;
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        throw error;
    }
};

userSchema.methods.updateCartQuantity = async function(productId, quantity) {
    const item = this.cart.find(item => 
        item.product.toString() === productId.toString()
    );

    if (!item) return false;

    item.quantity = quantity;
    await this.save();
    return true;
};

userSchema.methods.clearCart = async function() {
    this.cart = [];
    return this.save();
};

// Add methods for token generation
userSchema.methods.generateActivationToken = function() {
    this.activationToken = crypto.randomBytes(32).toString('hex');
    this.activationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
};

userSchema.methods.generateResetToken = function() {
    this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
};

module.exports = mongoose.model('User', userSchema);