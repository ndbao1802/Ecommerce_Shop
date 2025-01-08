const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    details: {
        brand: String,
        material: String,
        origin: String,
        warranty: String
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    discount: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    },
    variants: [{
        color: String,
        size: String,
        stock: Number,
        sku: String
    }],
    images: [{
        type: String,
        required: true
    }],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        images: [String],
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalSold: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [String],
    isFeatured: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Create slug before saving
productSchema.pre('save', function(next) {
    this.slug = this.name.toLowerCase().replace(/ /g, '-');
    next();
});

module.exports = mongoose.model('Product', productSchema); 