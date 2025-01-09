const Banner = require('../../models/bannerModel');
const { cloudinary } = require('../../config/cloudinary');

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort('displayOrder');
        res.render('admin/banners/index', {
            layout: 'layouts/adminLayout',
            banners
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading banners');
        res.redirect('/admin/dashboard');
    }
};

exports.getCreateBanner = (req, res) => {
    res.render('admin/banners/create', {
        layout: 'layouts/adminLayout'
    });
};

exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, description, buttonText, buttonLink, displayOrder, isActive } = req.body;

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'ecommerce/banners'
        });

        const banner = new Banner({
            title,
            subtitle,
            description,
            buttonText,
            buttonLink,
            displayOrder: parseInt(displayOrder) || 0,
            isActive: isActive === 'on',
            image: {
                url: result.secure_url,
                public_id: result.public_id
            }
        });

        await banner.save();
        req.flash('success_msg', 'Banner created successfully');
        res.redirect('/admin/banners');
    } catch (error) {
        console.error('Error creating banner:', error);
        req.flash('error_msg', 'Error creating banner');
        res.redirect('/admin/banners/create');
    }
};

exports.getEditBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            req.flash('error_msg', 'Banner not found');
            return res.redirect('/admin/banners');
        }
        res.render('admin/banners/edit', {
            layout: 'layouts/adminLayout',
            banner
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading banner');
        res.redirect('/admin/banners');
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const { title, subtitle, description, buttonText, buttonLink, displayOrder, isActive } = req.body;
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            req.flash('error_msg', 'Banner not found');
            return res.redirect('/admin/banners');
        }

        // Handle image update if new image is uploaded
        if (req.file) {
            // Delete old image from Cloudinary
            if (banner.image.public_id) {
                await cloudinary.uploader.destroy(banner.image.public_id);
            }
            
            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'ecommerce/banners'
            });
            
            banner.image = {
                url: result.secure_url,
                public_id: result.public_id
            };
        }

        // Update other fields
        banner.title = title;
        banner.subtitle = subtitle;
        banner.description = description;
        banner.buttonText = buttonText;
        banner.buttonLink = buttonLink;
        banner.displayOrder = parseInt(displayOrder) || 0;
        banner.isActive = isActive === 'on';

        await banner.save();
        req.flash('success_msg', 'Banner updated successfully');
        res.redirect('/admin/banners');
    } catch (error) {
        console.error('Error updating banner:', error);
        req.flash('error_msg', 'Error updating banner');
        res.redirect('/admin/banners');
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (banner && banner.image.public_id) {
            await cloudinary.uploader.destroy(banner.image.public_id);
        }
        
        await Banner.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Banner deleted successfully');
        res.redirect('/admin/banners');
    } catch (error) {
        console.error('Error deleting banner:', error);
        req.flash('error_msg', 'Error deleting banner');
        res.redirect('/admin/banners');
    }
}; 