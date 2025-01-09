const mongoose = require('mongoose');

// Clear any existing models to avoid schema conflicts
mongoose.models = {};
mongoose.modelSchemas = {};

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    images: [{
        url: String,
        public_id: String
    }],
    brand: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    strict: true,
    strictQuery: true
});

// Remove all middleware
productSchema.pre('save', function(next) {
    next();
});

// Create a new model instance
const Product = mongoose.model('Product', productSchema);

module.exports = Product; 