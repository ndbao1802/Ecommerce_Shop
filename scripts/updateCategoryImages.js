const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
require('dotenv').config();

const updateCategoryImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const categories = await Category.find({});
        
        for (const category of categories) {
            if (category.image && typeof category.image === 'object') {
                category.image = category.image.url;
                await category.save();
                console.log(`Updated category: ${category.name}`);
            }
        }

        console.log('All categories updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        process.exit(1);
    }
};

updateCategoryImages(); 