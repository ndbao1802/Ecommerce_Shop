const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
require('../models/index');

const runMigrations = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all migration files
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith('.js')).sort();

        // Run migrations in sequence
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migration = require(path.join(migrationsDir, file));
            await migration.up();
            console.log(`Completed migration: ${file}`);
        }

        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigrations(); 