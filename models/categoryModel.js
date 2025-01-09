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
    image: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Generate slug before saving
categorySchema.pre('save', function(next) {
    if (this.name) {
        this.slug = slugify(this.name, {
            lower: true,      // Convert to lowercase
            strict: true,     // Remove special characters
            trim: true        // Trim whitespace
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

module.exports = mongoose.model('Category', categorySchema); 