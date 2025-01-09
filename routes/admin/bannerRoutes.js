const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/admin/bannerController');
const { upload } = require('../../middleware/upload');
const { isAdmin } = require('../../middleware/auth');

router.get('/', isAdmin, bannerController.getBanners);
router.get('/create', isAdmin, bannerController.getCreateBanner);
router.post('/', isAdmin, upload.single('image'), bannerController.createBanner);
router.get('/:id/edit', isAdmin, bannerController.getEditBanner);
router.put('/:id', isAdmin, upload.single('image'), bannerController.updateBanner);
router.delete('/:id', isAdmin, bannerController.deleteBanner);

module.exports = router; 