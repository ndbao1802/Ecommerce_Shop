const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

async function resetCarts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop the carts collection if it exists
        try {
            await mongoose.connection.db.dropCollection('carts');
            console.log('Carts collection dropped');
        } catch (error) {
            if (error.code === 26) {
                console.log('Carts collection does not exist - skipping drop');
            } else {
                console.error('Error dropping carts collection:', error);
            }
        }

        // Reset cart arrays in all user documents
        const result = await User.updateMany(
            {},
            { $set: { cart: [] } }
        );

        console.log(`Reset cart arrays for ${result.modifiedCount} users`);

    } catch (error) {
        console.error('Error in reset process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

resetCarts(); 