const mongoose = require('mongoose');
const data = require('./data.js');
const Listing = require('../models/listing.js');
const User = require('../models/user.js');

const MONGO_URL='mongodb://localhost:27017/fresh_haven';

// Rebuild the local database with the sample listings and seed owner.
async function initDB() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to database');

        const seedOwner = await User.findOneAndUpdate(
            { username: 'seed-owner' },
            { $setOnInsert: { email: 'seed-owner@freshhaven.local' } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        await Listing.deleteMany({});
        const listings = data.data.map((listing) => ({
            ...listing,
            owner: seedOwner._id,
        }));
        await Listing.insertMany(listings);
        console.log(`Database initialized with ${data.data.length} listings`);
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

initDB();
