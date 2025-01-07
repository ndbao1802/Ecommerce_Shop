const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: 'default-category.jpg'
    }
}, { timestamps: true });

// Create slug before saving
categorySchema.pre('save', function(next) {
    this.slug = this.name.toLowerCase().replace(/ /g, '-');
    next();
});

module.exports = mongoose.model('Category', categorySchema); 