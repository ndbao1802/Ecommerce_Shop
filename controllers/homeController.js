const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

exports.getHome = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).limit(6);
        const featuredProducts = await Product.find({ 
            isActive: true, 
            isFeatured: true 
        })
            .sort({ displayOrder: 1 })
            .populate('category')
            .limit(8);

        res.render('home', {
            categories,
            featuredProducts
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('error', { message: 'Error loading home page' });
    }
}; 