const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const Banner = require('../../models/bannerModel');

async function getDashboard(req, res) {
    try {
        const productsCount = await Product.countDocuments();
        const categoriesCount = await Category.countDocuments();
        const bannersCount = await Banner.countDocuments();
        
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('category');

        res.render('admin/dashboard', {
            layout: 'layouts/adminLayout',
            counts: {
                products: productsCount,
                categories: categoriesCount,
                banners: bannersCount
            },
            recentProducts
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        req.flash('error_msg', 'Error loading dashboard data');
        res.render('admin/dashboard', {
            layout: 'layouts/adminLayout',
            counts: { products: 0, categories: 0, banners: 0 },
            recentProducts: []
        });
    }
}

module.exports = {
    getDashboard
}; 