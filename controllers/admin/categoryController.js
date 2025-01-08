const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');
const { cloudinary } = require('../../config/cloudinary');
const { upload } = require('../../middleware/upload');

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categories/index', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading categories');
        res.redirect('/admin/dashboard');
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        
        let imageUrl = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.secure_url;
        }

        const category = new Category({
            name,
            description,
            image: imageUrl,
            isActive: isActive === 'on' || isActive === true
        });

        await category.save();
        req.flash('success_msg', 'Category created successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error creating category:', error);
        req.flash('error_msg', 'Error creating category');
        res.redirect('/admin/categories');
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, description, displayOrder, isActive } = req.body;
        await Category.findByIdAndUpdate(req.params.id, {
            name,
            description,
            displayOrder,
            isActive: isActive === 'true'
        });
        req.flash('success_msg', 'Category updated successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        req.flash('error_msg', 'Error updating category');
        res.redirect('/admin/categories');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Category deleted successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        req.flash('error_msg', 'Error deleting category');
        res.redirect('/admin/categories');
    }
};

exports.getProductCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();
        
        // Get product count for each category
        for (let category of categories) {
            category.productsCount = await Product.countDocuments({ category: category._id });
        }

        res.render('admin/categories/products', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading product categories');
        res.redirect('/admin/dashboard');
    }
}; 