const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: String,
    image: String,
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Create slug before saving
categorySchema.pre('save', function(next) {
    this.slug = this.name.toLowerCase().replace(/ /g, '-');
    next();
});

module.exports = mongoose.model('Category', categorySchema); 