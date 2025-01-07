const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const { cloudinary } = require('../../config/cloudinary');

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('admin/products/index', {
            layout: 'layouts/adminLayout',
            products
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading products');
        res.redirect('/admin/dashboard');
    }
};

exports.getCreateProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.render('admin/products/create', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading categories');
        res.redirect('/admin/products');
    }
};

exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            details
        } = req.body;

        // Handle image uploads
        const images = req.files ? req.files.map(file => file.path) : [];

        // Create variants array from form data
        const variants = [];
        if (req.body.colors && req.body.sizes && req.body.stocks) {
            const colors = Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors];
            const sizes = Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes];
            const stocks = Array.isArray(req.body.stocks) ? req.body.stocks : [req.body.stocks];

            colors.forEach((color, index) => {
                variants.push({
                    color,
                    size: sizes[index],
                    stock: stocks[index],
                    sku: `${name.substring(0, 3).toUpperCase()}-${color.substring(0, 2)}-${sizes[index]}`
                });
            });
        }

        const product = new Product({
            name,
            description,
            price,
            originalPrice,
            category,
            images,
            variants,
            details: JSON.parse(details)
        });

        await product.save();
        req.flash('success_msg', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error_msg', 'Error creating product');
        res.redirect('/admin/products/create');
    }
};

exports.getEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        const categories = await Category.find({ isActive: true });
        
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        res.render('admin/products/edit', {
            layout: 'layouts/adminLayout',
            product,
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading product');
        res.redirect('/admin/products');
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            details,
            existingImages
        } = req.body;

        // Handle image uploads
        let images = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
        if (req.files) {
            const newImages = req.files.map(file => file.path);
            images = [...images, ...newImages];
        }

        // Update variants
        const variants = [];
        if (req.body.colors && req.body.sizes && req.body.stocks) {
            const colors = Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors];
            const sizes = Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes];
            const stocks = Array.isArray(req.body.stocks) ? req.body.stocks : [req.body.stocks];

            colors.forEach((color, index) => {
                variants.push({
                    color,
                    size: sizes[index],
                    stock: stocks[index],
                    sku: `${name.substring(0, 3).toUpperCase()}-${color.substring(0, 2)}-${sizes[index]}`
                });
            });
        }

        await Product.findByIdAndUpdate(req.params.id, {
            name,
            description,
            price,
            originalPrice,
            category,
            images,
            variants,
            details: JSON.parse(details)
        });

        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error_msg', 'Error updating product');
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                const publicId = image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/admin/products');
    }
}; 