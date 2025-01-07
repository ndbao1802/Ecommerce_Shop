const mongoose = require('mongoose');

module.exports = {
    up: async () => {
        // Create collections and indexes
        await Promise.all([
            mongoose.model('User').createIndexes(),
            mongoose.model('Product').createIndexes(),
            mongoose.model('Category').createIndexes(),
            mongoose.model('Order').createIndexes(),
            mongoose.model('Advertisement').createIndexes(),
            mongoose.model('News').createIndexes(),
            mongoose.model('Contact').createIndexes(),
            mongoose.model('SystemSetting').createIndexes(),
            mongoose.model('Wishlist').createIndexes()
        ]);
    },
    down: async () => {
        // Drop collections if needed
        await Promise.all([
            mongoose.connection.dropCollection('users'),
            mongoose.connection.dropCollection('products'),
            mongoose.connection.dropCollection('categories'),
            mongoose.connection.dropCollection('orders'),
            mongoose.connection.dropCollection('advertisements'),
            mongoose.connection.dropCollection('news'),
            mongoose.connection.dropCollection('contacts'),
            mongoose.connection.dropCollection('systemsettings'),
            mongoose.connection.dropCollection('wishlists')
        ]).catch(err => {
            // Ignore collection not found errors
            if (err.code !== 26) {
                throw err;
            }
        });
    }
}; 