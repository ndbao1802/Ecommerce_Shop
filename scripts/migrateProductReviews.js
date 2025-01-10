const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/productModel');

async function migrateProductReviews() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Add this check at the start of the migration function
        const checkProduct = await Product.findOne({ ratings: { $exists: true } });
        if (checkProduct) {
            console.log('Migration has already been run. Exiting...');
            return;
        }

        // Get all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to migrate`);

        for (const product of products) {
            // Initialize new ratings structure if it doesn't exist
            if (!product.ratings) {
                product.ratings = {
                    average: 0,
                    total: 0,
                    distribution: {
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0
                    }
                };
            }

            // Calculate ratings from existing reviews
            if (product.reviews && product.reviews.length > 0) {
                // Reset distribution
                product.ratings.distribution = {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0
                };

                // Count reviews for each rating
                product.reviews.forEach(review => {
                    if (review.rating >= 1 && review.rating <= 5) {
                        product.ratings.distribution[review.rating]++;
                    }
                });

                // Calculate total and average
                product.ratings.total = product.reviews.length;
                const sum = product.reviews.reduce((acc, review) => acc + review.rating, 0);
                product.ratings.average = sum / product.ratings.total;
            }

            // Save the updated product
            await product.save();
            console.log(`Migrated product: ${product.name}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
migrateProductReviews(); 