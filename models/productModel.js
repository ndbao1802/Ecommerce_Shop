const mongoose = require('mongoose');
const slugify = require('slugify');

// Clear any existing models to avoid schema conflicts
mongoose.models = {};
mongoose.modelSchemas = {};

// Create Review Schema
const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

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
    brand: {
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
    reviews: [reviewSchema],
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        total: {
            type: Number,
            default: 0
        },
        distribution: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        }
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

// Method to add a review and update ratings
productSchema.methods.addReview = async function(userId, rating, comment) {
    // Check if user has already reviewed
    const existingReview = this.reviews.find(review => 
        review.user.toString() === userId.toString()
    );

    if (existingReview) {
        throw new Error('You have already reviewed this product');
    }

    // Add new review
    this.reviews.push({
        user: userId,
        rating,
        comment
    });

    // Update rating distribution
    this.ratings.distribution[rating]++;
    this.ratings.total++;

    // Calculate new average
    let sum = 0;
    Object.entries(this.ratings.distribution).forEach(([rating, count]) => {
        sum += rating * count;
    });
    this.ratings.average = sum / this.ratings.total;

    return this.save();
};

// Method to remove a review
productSchema.methods.removeReview = async function(userId) {
    const reviewIndex = this.reviews.findIndex(review => 
        review.user.toString() === userId.toString()
    );

    if (reviewIndex === -1) {
        throw new Error('Review not found');
    }

    const rating = this.reviews[reviewIndex].rating;

    // Update rating distribution
    this.ratings.distribution[rating]--;
    this.ratings.total--;

    // Remove review
    this.reviews.splice(reviewIndex, 1);

    // Recalculate average if there are still reviews
    if (this.ratings.total > 0) {
        let sum = 0;
        Object.entries(this.ratings.distribution).forEach(([rating, count]) => {
            sum += rating * count;
        });
        this.ratings.average = sum / this.ratings.total;
    } else {
        this.ratings.average = 0;
    }

    return this.save();
};

// Create a new model instance
const Product = mongoose.model('Product', productSchema);

module.exports = Product; 