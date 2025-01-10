const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { uploadMultiple } = require('../middleware/upload');
const { ensureAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetails);

// Protected routes for reviews (will implement later)
router.post('/:id/reviews', ensureAuthenticated, productController.addReview);
router.get('/:id/reviews', productController.getReviews);

// Add review controller methods to productController
const reviewController = {
    addReview: async (req, res) => {
        try {
            const { rating, comment } = req.body;
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const review = {
                user: req.user._id,
                rating: parseInt(rating),
                comment
            };

            product.reviews.push(review);
            product.calculateAverageRating();
            await product.save();

            if (req.xhr) {
                return res.json({ success: true });
            }

            req.flash('success_msg', 'Review added successfully');
            res.redirect(`/products/${req.params.id}`);
        } catch (error) {
            console.error('Error adding review:', error);
            if (req.xhr) {
                return res.status(500).json({ error: 'Error adding review' });
            }
            req.flash('error_msg', 'Error adding review');
            res.redirect(`/products/${req.params.id}`);
        }
    },

    getReviews: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const skip = (page - 1) * limit;

            const product = await Product.findById(req.params.id)
                .populate({
                    path: 'reviews.user',
                    select: 'name'
                })
                .slice('reviews', [skip, limit]);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const total = product.reviews.length;

            if (req.xhr) {
                return res.json({
                    reviews: product.reviews,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }

            res.render('products/reviews', {
                reviews: product.reviews,
                productId: req.params.id,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting reviews:', error);
            if (req.xhr) {
                return res.status(500).json({ error: 'Error getting reviews' });
            }
            res.status(500).render('error', { message: 'Error getting reviews' });
        }
    }
};

// Add review methods to productController
Object.assign(productController, reviewController);

module.exports = router; 