const Product = require('../../models/productModel');

exports.getHomePageSettings = async (req, res) => {
    try {
        const featuredProducts = await Product.find({ isFeatured: true })
            .sort({ displayOrder: 1 })
            .populate('category');
        
        const availableProducts = await Product.find({ isFeatured: false })
            .sort({ name: 1 })
            .populate('category');

        res.render('admin/homepage/settings', {
            layout: 'layouts/adminLayout',
            featuredProducts,
            availableProducts
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading home page settings');
        res.redirect('/admin/dashboard');
    }
};

exports.updateFeaturedProducts = async (req, res) => {
    try {
        const { productIds, displayOrders } = req.body;
        
        // First, remove all featured flags
        await Product.updateMany({}, { isFeatured: false });

        // Then set new featured products
        if (productIds && productIds.length > 0) {
            for (let i = 0; i < productIds.length; i++) {
                await Product.findByIdAndUpdate(productIds[i], {
                    isFeatured: true,
                    displayOrder: displayOrders[i] || i
                });
            }
        }

        req.flash('success_msg', 'Featured products updated successfully');
        res.redirect('/admin/homepage/settings');
    } catch (error) {
        console.error('Error updating featured products:', error);
        req.flash('error_msg', 'Error updating featured products');
        res.redirect('/admin/homepage/settings');
    }
}; 