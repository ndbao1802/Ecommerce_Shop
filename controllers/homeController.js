const Category = require('../models/categoryModel');
const Banner = require('../models/bannerModel');
const Product = require('../models/productModel');

exports.getHome = async (req, res) => {
    try {
        // Fetch categories with product counts
        const categories = await Category.find({ isActive: true });
        
        // Get product count for each category
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category._id });
            return {
                ...category.toObject(),
                productCount
            };
        }));

        // Fetch active banners
        const banners = await Banner.find({ isActive: true }).sort('displayOrder');

        res.render('home/index', {
            categories: categoriesWithCount,
            banners,
            layout: 'layouts/main'
        });
    } catch (error) {
        console.error('Error loading homepage:', error);
        res.status(500).render('error', { 
            message: 'Error loading homepage',
            layout: 'layouts/main'
        });
    }
}; 