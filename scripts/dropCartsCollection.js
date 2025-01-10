const mongoose = require('mongoose');
require('dotenv').config();

async function dropCartsCollection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop the carts collection
        await mongoose.connection.db.dropCollection('carts');
        console.log('Carts collection dropped successfully');
    } catch (error) {
        if (error.code === 26) {
            console.log('Carts collection does not exist - nothing to drop');
        } else {
            console.error('Error dropping carts collection:', error);
        }
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

dropCartsCollection(); 