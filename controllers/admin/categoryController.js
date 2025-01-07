const Category = require('../../models/categoryModel');

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
        const { name, description, displayOrder } = req.body;
        const category = new Category({
            name,
            description,
            displayOrder: displayOrder || 0
        });
        await category.save();
        req.flash('success_msg', 'Category created successfully');
        res.redirect('/admin/categories');
    } catch (error) {
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
        const categories = await Category.find();
        res.render('admin/categories/products', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading product categories');
        res.redirect('/admin/dashboard');
    }
}; 