const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const Report = require('../../models/reportModel');

const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    
    switch(range) {
        case 'day':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(start.getDate() - 7);
            break;
        case 'month':
            start.setMonth(start.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(start.getFullYear() - 1);
            break;
        default:
            start.setDate(start.getDate() - 30); // Default to last 30 days
    }
    
    return { start, end };
};

const reportController = {
    getRevenueReport: async (req, res) => {
        try {
            const range = req.query.range || 'month';
            const { start, end } = getDateRange(range);

            const revenueData = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        status: 'delivered'
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        totalRevenue: { $sum: "$total" },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
            ]);

            res.render('admin/reports/revenue', {
                layout: 'layouts/adminLayout',
                revenueData,
                range
            });
        } catch (error) {
            console.error('Error generating revenue report:', error);
            req.flash('error_msg', 'Error generating report');
            res.redirect('/admin/dashboard');
        }
    },

    getProductReport: async (req, res) => {
        try {
            const range = req.query.range || 'month';
            const { start, end } = getDateRange(range);

            const productData = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        status: 'delivered'
                    }
                },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.product",
                        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                        totalQuantity: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 }
            ]);

            await Product.populate(productData, { path: "_id", select: "name" });

            res.render('admin/reports/products', {
                layout: 'layouts/adminLayout',
                productData,
                range
            });
        } catch (error) {
            console.error('Error generating product report:', error);
            req.flash('error_msg', 'Error generating report');
            res.redirect('/admin/dashboard');
        }
    },

    getUserReports: async (req, res) => {
        try {
            const reports = await Report.find()
                .populate('user', 'name email')
                .populate('product', 'name')
                .sort('-createdAt')
                .lean();

            res.render('admin/reports/user-reports', {
                layout: 'layouts/adminLayout',
                reports
            });
        } catch (error) {
            console.error('Error fetching user reports:', error);
            req.flash('error_msg', 'Error loading reports');
            res.redirect('/admin/dashboard');
        }
    },

    updateReport: async (req, res) => {
        try {
            const { reportId } = req.params;
            const { status, adminResponse } = req.body;

            const report = await Report.findById(reportId);
            if (!report) {
                return res.status(404).json({ success: false, error: 'Report not found' });
            }

            report.status = status;
            report.adminResponse = adminResponse;
            if (status === 'resolved' || status === 'dismissed') {
                report.resolvedAt = new Date();
            }

            await report.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Error updating report:', error);
            res.status(500).json({ success: false, error: 'Error updating report' });
        }
    },

    getDashboard: async (req, res) => {
        try {
            // Get recent reports
            const recentReports = await Report.find()
                .sort('-createdAt')
                .limit(5)
                .lean();

            res.render('admin/reports/dashboard', {
                layout: 'layouts/adminLayout',
                recentReports
            });
        } catch (error) {
            console.error('Error loading reports dashboard:', error);
            req.flash('error_msg', 'Error loading dashboard');
            res.redirect('/admin/dashboard');
        }
    }
};

module.exports = reportController; 