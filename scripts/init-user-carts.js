const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

async function initializeUserCarts() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find users without cart
        const users = await User.find({ cart: { $exists: false } });
        console.log(`Found ${users.length} users without cart`);

        // Initialize cart for each user
        for (const user of users) {
            user.cart = { items: [] };
            await user.save();
            console.log(`Initialized cart for user: ${user.email}`);
        }

        console.log('Cart initialization complete');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
initializeUserCarts(); 