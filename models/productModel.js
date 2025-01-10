const mongoose = require('mongoose');
const slugify = require('slugify');

// Clear any existing models to avoid schema conflicts
mongoose.models = {};
mongoose.modelSchemas = {};

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
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
    manufacturer: {
        type: String,
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
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    strict: true,
    strictQuery: true
});

// Generate slug before saving
productSchema.pre('save', function(next) {
    if (this.name) {
        this.slug = slugify(this.name + '-' + Math.random().toString(36).substring(2, 8), {
            lower: true,
            strict: true
        });
    }
    next();
});

// Also handle slug generation on update
productSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = slugify(update.name + '-' + Math.random().toString(36).substring(2, 8), {
            lower: true,
            strict: true
        });
    }
    next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
    if (this.reviews.length === 0) {
        this.averageRating = 0;
    } else {
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.averageRating = sum / this.reviews.length;
    }
    return this.averageRating;
};

// Create a new model instance
const Product = mongoose.model('Product', productSchema);

module.exports = Product; 