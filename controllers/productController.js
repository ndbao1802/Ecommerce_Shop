const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const productController = {
    // Get all products with filters
    getProducts: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const skip = (page - 1) * limit;

            // Build query
            let query = { isActive: true };
            
            // Search functionality
            if (req.query.search) {
                const searchRegex = new RegExp(req.query.search, 'i');
                query.$or = [
                    { name: searchRegex },
                    { description: searchRegex },
                    { brand: searchRegex }
                ];
            }

            // Category filter
            if (req.query.category) {
                query.category = req.query.category;
            }

            // Brand filter
            if (req.query.brand) {
                query.brand = req.query.brand;
            }

            // Price range filter
            if (req.query.minPrice || req.query.maxPrice) {
                query.price = {};
                if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
                if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
            }

            // Get max price for filter
            const highestPriceProduct = await Product.findOne()
                .sort({ price: -1 })
                .select('price');
            const maxPrice = Math.ceil(highestPriceProduct?.price || 1000);

            // Get products
            const products = await Product.find(query)
                .populate('category')
                .sort(req.query.sort || '-createdAt')
                .skip(skip)
                .limit(limit);

            // Get total count
            const total = await Product.countDocuments(query);

            // Get categories for filter
            const categories = await Category.find();

            // Get unique brands for filter
            const brands = await Product.distinct('brand');

            // If AJAX request, return JSON
            if (req.xhr || req.headers.accept.includes('json')) {
                return res.json({
                    success: true,
                    products,
                    pagination: {
                        page,
                        pages: Math.ceil(total / limit),
                        total
                    },
                    filters: {
                        categories,
                        brands
                    }
                });
            }

            // Render view for regular request
            res.render('products/index', {
                products,
                categories,
                brands,
                filters: req.query,
                pagination: {
                    page,
                    pages: Math.ceil(total / limit),
                    total
                },
                maxPrice
            });

        } catch (error) {
            console.error('Error getting products:', error);
            if (req.xhr) {
                return res.status(500).json({
                    success: false,
                    error: 'Error getting products'
                });
            }
            res.status(500).render('error', { 
                message: 'Error getting products',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    },

    // Get single product
    getProductById: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
                .populate('category')
                .populate({
                    path: 'reviews.user',
                    select: 'name avatar'
                });

            if (!product) {
                if (req.xhr) {
                    return res.status(404).json({
                        success: false,
                        error: 'Product not found'
                    });
                }
                return res.status(404).render('error', { 
                    message: 'Product not found' 
                });
            }

            // Get related products from same category
            const relatedProducts = await Product.find({
                category: product.category._id,
                _id: { $ne: product._id } // Exclude current product
            })
            .limit(4)
            .populate('category');

            // If AJAX request, return JSON
            if (req.xhr || req.headers.accept.includes('json')) {
                return res.json({
                    success: true,
                    product,
                    relatedProducts
                });
            }

            // Render view for regular request
            res.render('products/details', {
                product,
                reviews: product.reviews,
                relatedProducts
            });

        } catch (error) {
            console.error('Error getting product:', error);
            if (req.xhr) {
                return res.status(500).json({
                    success: false,
                    error: 'Error getting product'
                });
            }
            res.status(500).render('error', { 
                message: 'Error getting product',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    },

    // Create product
    createProduct: async (req, res) => {
        try {
            const product = new Product(req.body);
            await product.save();

            res.status(201).json({
                success: true,
                product
            });

        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({
                success: false,
                error: 'Error creating product'
            });
        }
    },

    // Update product
    updateProduct: async (req, res) => {
        try {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            res.json({
                success: true,
                product
            });

        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating product'
            });
        }
    },

    // Delete product
    deleteProduct: async (req, res) => {
        try {
            const product = await Product.findByIdAndDelete(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product deleted'
            });

        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({
                success: false,
                error: 'Error deleting product'
            });
        }
    },

    // Get reviews
    getReviews: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
                .populate({
                    path: 'reviews.user',
                    select: 'name avatar'
                });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            res.json({
                success: true,
                reviews: product.reviews
            });

        } catch (error) {
            console.error('Error getting reviews:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting reviews'
            });
        }
    },

    // Add review
    addReview: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            const { rating, comment } = req.body;

            product.reviews.push({
                user: req.user._id,
                rating,
                comment
            });

            await product.save();

            res.json({
                success: true,
                reviews: product.reviews
            });

        } catch (error) {
            console.error('Error adding review:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding review'
            });
        }
    },

    // Get products by category
    getProductsByCategory: async (req, res) => {
        try {
            const products = await Product.find({
                category: req.params.categoryId,
                isActive: true
            }).populate('category');

            res.json({
                success: true,
                products
            });

        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting products'
            });
        }
    },

    // Search products
    searchProducts: async (req, res) => {
        try {
            const searchRegex = new RegExp(req.params.query, 'i');
            const products = await Product.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { brand: searchRegex }
                ],
                isActive: true
            });

            res.json({
                success: true,
                products
            });

        } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).json({
                success: false,
                error: 'Error searching products'
            });
        }
    },

    // Get products by brand
    getProductsByBrand: async (req, res) => {
        try {
            const products = await Product.find({
                brand: req.params.brand,
                isActive: true
            });

            res.json({
                success: true,
                products
            });

        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting products'
            });
        }
    },

    // Get products by price range
    getProductsByPriceRange: async (req, res) => {
        try {
            const { min, max } = req.params;
            const products = await Product.find({
                price: {
                    $gte: parseFloat(min),
                    $lte: parseFloat(max)
                },
                isActive: true
            });

            res.json({
                success: true,
                products
            });

        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting products'
            });
        }
    }
};

module.exports = productController; 