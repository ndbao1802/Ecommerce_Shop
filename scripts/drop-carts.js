const mongoose = require('mongoose');
require('dotenv').config();

async function dropCartsCollection() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop the carts collection
        console.log('Dropping carts collection...');
        await mongoose.connection.collection('carts').drop();
        console.log('Successfully dropped carts collection');

    } catch (error) {
        if (error.code === 26) {
            console.log('Collection does not exist, nothing to drop');
        } else {
            console.error('Error:', error);
        }
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
dropCartsCollection(); 