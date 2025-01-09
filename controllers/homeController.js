const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

exports.getHome = async (req, res) => {
    try {
        // Fetch categories
        const categories = await Category.find({ isActive: true });
        
        // Log to verify data
        console.log('Categories found:', categories);

        // Fetch featured products or other data you need
        // const featuredProducts = await Product.find({ isFeatured: true });

        res.render('home/index', {
            categories,
            // featuredProducts,
            layout: 'layouts/main' // Make sure you're using the correct layout
        });
    } catch (error) {
        console.error('Error loading homepage:', error);
        res.status(500).render('error', { 
            message: 'Error loading homepage',
            layout: 'layouts/main'
        });
    }
}; 