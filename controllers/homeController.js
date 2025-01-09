const Category = require('../models/categoryModel');
const Banner = require('../models/bannerModel');
const Product = require('../models/productModel');

exports.getHome = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .lean()  // Convert to plain JavaScript objects
            .exec();

        // Add product count to each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Product.countDocuments({ 
                    category: category._id,
                    isActive: true 
                });
                return {
                    ...category,
                    productCount: count,
                    // Ensure image is properly structured
                    image: category.image?.url || category.image || null
                };
            })
        );

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