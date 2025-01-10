const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const pageController = {
    // Redirect shop to products
    getShop: async (req, res) => {
        res.redirect('/products');
    },

    // Featured products page
    getFeatured: async (req, res) => {
        try {
            const featuredProducts = await Product.find({ 
                isActive: true,
                isFeatured: true 
            }).populate('category');

            res.render('pages/featured', {
                layout: 'layouts/main',
                featuredProducts
            });
        } catch (error) {
            console.error('Error loading featured page:', error);
            res.status(500).render('error', { message: 'Error loading featured page' });
        }
    },

    // Pages listing
    getPages: async (req, res) => {
        res.render('pages/pages', {
            layout: 'layouts/main',
            pages: [
                { title: 'FAQ', url: '/pages/faq' },
                { title: 'Privacy Policy', url: '/pages/privacy' },
                { title: 'Terms of Service', url: '/pages/terms' },
                { title: 'Shipping Information', url: '/pages/shipping' },
                { title: 'Return Policy', url: '/pages/returns' }
            ]
        });
    },

    // About page
    getAbout: async (req, res) => {
        res.render('pages/about', {
            layout: 'layouts/main'
        });
    }
};

module.exports = pageController; 