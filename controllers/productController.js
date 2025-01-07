const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const { cloudinary } = require('../config/cloudinary');

exports.getAllProducts = async (req, res) => {
    try {
        const { minPrice, maxPrice, sort, category } = req.query;
        let query = {};
        
        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Build sort options
        let sortOption = {};
        switch(sort) {
            case 'price_asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
                sortOption = { price: -1 };
                break;
            case 'rating':
                sortOption = { averageRating: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        const products = await Product.find(query)
            .populate('category')
            .sort(sortOption);
            
        const categories = await Category.find();

        res.render('products/index', { 
            products,
            categories,
            filters: req.query
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading products');
        res.redirect('/');
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/products');
        }
        res.render('products/show', { product });
    } catch (error) {
        req.flash('error_msg', 'Error loading product');
        res.redirect('/products');
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;
        
        // Handle uploaded images
        if (req.files) {
            productData.images = req.files.map(file => file.path);
        }

        const product = new Product(productData);
        await product.save();
        
        req.flash('success_msg', 'Product created successfully');
        res.redirect('/products');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error_msg', 'Error creating product');
        res.redirect('/products');
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productData = req.body;
        
        // Handle uploaded images
        if (req.files) {
            // Delete old images from Cloudinary
            const oldProduct = await Product.findById(req.params.id);
            for (const imageUrl of oldProduct.images) {
                const publicId = imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            
            // Add new images
            productData.images = req.files.map(file => file.path);
        }

        await Product.findByIdAndUpdate(req.params.id, productData);
        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/products');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error_msg', 'Error updating product');
        res.redirect('/products');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        // Delete images from Cloudinary
        for (const imageUrl of product.images) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/products');
    }
}; 