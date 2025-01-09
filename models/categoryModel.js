const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: String,
    image: {
        type: mongoose.Schema.Types.Mixed,
        get: function(image) {
            if (!image) return null;
            if (typeof image === 'string') {
                return { url: image, public_id: null };
            }
            return image;
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
    if (this.name) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            trim: true
        });
    }
    next();
});

// Also handle slug generation on update
categorySchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = slugify(update.name, {
            lower: true,
            strict: true,
            trim: true
        });
    }
    next();
});

// Add a helper method to handle image URLs
categorySchema.methods.getImageUrl = function() {
    if (!this.image) return '/images/default-category.jpg';
    return this.image.url || this.image || '/images/default-category.jpg';
};

module.exports = mongoose.model('Category', categorySchema); 