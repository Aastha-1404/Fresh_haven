const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review.js');

// Listing data and the user who owns each listing.
const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 20,
        maxlength: 1000,
    },
    category: {
        type: String,
        enum: ['farms', 'rooms', 'amazing-views', 'iconic-sites', 'beach', 'cabins'],
        default: 'rooms',
    },
    image: {
        filename: String,
        url: {
            type: String,
            filename: String,
            trim: true,
            set: value => value === '' ? undefined : value,
            match: /^(https?:\/\/\S+|\/uploads\/[A-Za-z0-9._-]+)$/i,
            default: "https://images.unsplash.com/photo-1787765977827-44dcefaefdaf?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8fHx8fA%3D%3D",
        },
    },
    price: {
        type: Number,
        required: true,
        min: 1,
        max: 1000000,
    },
    location: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80,
        match: /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/,
    },
    country: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80,
        match: /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/,
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review',
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

listingSchema.post('findOneAndDelete', async function (listing) {
    // Remove reviews that belong to a deleted listing.
    if (listing) {
        await Review.deleteMany({
            _id: { $in: listing.reviews }
        });
    }
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
