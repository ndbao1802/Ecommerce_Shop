const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const productController = {
    // Get products with filtering, sorting, and pagination
    getProducts: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const skip = (page - 1) * limit;

            // Build filter query
            let query = { isActive: true };
            
            // Search by name
            if (req.query.search) {
                query.name = { $regex: new RegExp(req.query.search, 'i') };
            }

            // Filter by category
            if (req.query.category) {
                query.category = req.query.category;
            }

            // Filter by brand
            if (req.query.brand) {
                query.brand = req.query.brand;
            }

            // Get max price for price range slider
            const highestPriceProduct = await Product.findOne({ isActive: true })
                .sort({ price: -1 })
                .select('price');
            const maxPrice = Math.ceil(highestPriceProduct?.price || 1000);

            // Filter by price range
            if (req.query.minPrice || req.query.maxPrice) {
                query.price = {};
                if (req.query.minPrice) {
                    query.price.$gte = parseFloat(req.query.minPrice);
                }
                if (req.query.maxPrice) {
                    query.price.$lte = parseFloat(req.query.maxPrice);
                }
            }

            // Build sort query
            let sort = {};
            if (req.query.sort) {
                switch (req.query.sort) {
                    case 'price-asc':
                        sort.price = 1;
                        break;
                    case 'price-desc':
                        sort.price = -1;
                        break;
                    case 'newest':
                        sort.createdAt = -1;
                        break;
                    case 'oldest':
                        sort.createdAt = 1;
                        break;
                    default:
                        sort.createdAt = -1;
                }
            } else {
                sort.createdAt = -1; // Default sort
            }

            // Get total count for pagination
            const total = await Product.countDocuments(query);

            // Get products
            const products = await Product.find(query)
                .populate('category')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            // Get all categories and unique brands
            const categories = await Category.find({ isActive: true });
            const uniqueBrands = await Product.distinct('brand');

            // If AJAX request
            if (req.xhr) {
                return res.json({
                    products,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    },
                    filters: req.query,
                    maxPrice
                });
            }

            // If regular request
            res.render('products/index', {
                products,
                categories,
                uniqueBrands,
                filters: req.query,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                maxPrice
            });
        } catch (error) {
            console.error('Error getting products:', error);
            if (req.xhr) {
                return res.status(500).json({ error: 'Error getting products' });
            }
            res.status(500).render('error', { message: 'Error getting products' });
        }
    },

    // Get product details
    getProductDetails: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
                .populate('category')
                .populate('reviews.user', 'name');

            if (!product) {
                return res.status(404).render('error', { message: 'Product not found' });
            }

            // Get related products
            const relatedProducts = await Product.find({
                category: product.category,
                _id: { $ne: product._id }
            })
            .limit(4)
            .populate('category');

            res.render('products/details', {
                product,
                relatedProducts
            });
        } catch (error) {
            console.error('Error getting product details:', error);
            res.status(500).render('error', { message: 'Error getting product details' });
        }
    },

    // Add these new methods
    addReview: async (req, res) => {
        try {
            // Check if user is logged in
            if (!req.user) {
                return res.status(401).json({ error: 'You must be logged in to review' });
            }

            const { rating, comment } = req.body;

            // Validate input
            if (!rating || !comment) {
                return res.status(400).json({ error: 'Rating and comment are required' });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Rating must be between 1 and 5' });
            }

            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            try {
                // Add review using the schema method
                await product.addReview(req.user._id, parseInt(rating), comment);

                // Get updated product with populated reviews
                const updatedProduct = await Product.findById(product._id)
                    .populate('reviews.user', 'name');

                if (req.xhr) {
                    return res.json({
                        success: true,
                        reviews: updatedProduct.reviews,
                        ratings: updatedProduct.ratings
                    });
                }

                req.flash('success_msg', 'Review added successfully');
                res.redirect(`/products/${req.params.id}`);
            } catch (error) {
                if (error.message.includes('already reviewed')) {
                    return res.status(400).json({ error: 'You have already reviewed this product' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error adding review:', error);
            if (req.xhr) {
                return res.status(500).json({ 
                    error: error.message || 'Error adding review'
                });
            }
            req.flash('error_msg', error.message || 'Error adding review');
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
                .select('reviews ratings');

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Get paginated reviews
            const reviews = product.reviews.slice(skip, skip + limit);
            const total = product.reviews.length;

            if (req.xhr) {
                return res.json({
                    reviews,
                    ratings: product.ratings,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }

            res.render('products/reviews', {
                reviews,
                ratings: product.ratings,
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

module.exports = productController; 