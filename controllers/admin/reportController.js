const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');

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

            const topProducts = await Order.aggregate([
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

            // Populate product details
            await Product.populate(topProducts, { path: "_id", select: "name" });

            res.render('admin/reports/index', {
                layout: 'layouts/adminLayout',
                revenueData,
                topProducts,
                range
            });
        } catch (error) {
            console.error('Error generating report:', error);
            req.flash('error_msg', 'Error generating report');
            res.redirect('/admin/dashboard');
        }
    }
};

module.exports = reportController; 