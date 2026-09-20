const Listing = require('../models/listing.js');
const validateListing = require('../utils/schema.js');
const AppError = require('../utils/AppError.js');

function normalizeListingBody(body = {}) {
    if (body.listing && typeof body.listing === 'object' && !Array.isArray(body.listing)) {
        return body.listing;
    }

    const nestedListing = {};
    Object.entries(body).forEach(([key, value]) => {
        const match = key.match(/^listing\[(.+)\]$/);
        if (match) {
            nestedListing[match[1]] = value;
        }
    });

    if (Object.keys(nestedListing).length) {
        return nestedListing;
    }

    const flatFields = ['title', 'description', 'price', 'location', 'country'];
    const flatListing = {};
    flatFields.forEach((field) => {
        if (body[field] !== undefined) {
            flatListing[field] = body[field];
        }
    });

    return Object.keys(flatListing).length ? flatListing : body;
}

// Render all listings for the public index page.
module.exports.index = async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const searchTerm = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const validSearchScopes = ['all', 'place', 'country', 'title'];
    const searchBy = validSearchScopes.includes(req.query.searchBy) ? req.query.searchBy : 'all';
    const minPrice = Number.isFinite(Number(req.query.minPrice)) && Number(req.query.minPrice) > 0 ? Number(req.query.minPrice) : '';
    const maxPrice = Number.isFinite(Number(req.query.maxPrice)) && Number(req.query.maxPrice) > 0 ? Number(req.query.maxPrice) : '';
    const validCategories = ['farms', 'rooms', 'amazing-views', 'iconic-sites', 'beach', 'cabins'];
    const query = validCategories.includes(category) ? { category } : {};
    const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (searchTerm && searchBy === 'all') {
        const escapedSearch = escapeRegex(searchTerm);
        query.$or = [
            { title: { $regex: escapedSearch, $options: 'i' } },
            { description: { $regex: escapedSearch, $options: 'i' } },
            { location: { $regex: escapedSearch, $options: 'i' } },
            { country: { $regex: escapedSearch, $options: 'i' } },
        ];
    }

    if (searchTerm && searchBy === 'place') {
        query.location = { $regex: escapeRegex(searchTerm), $options: 'i' };
    }

    if (searchTerm && searchBy === 'country') {
        query.country = { $regex: escapeRegex(searchTerm), $options: 'i' };
    }

    if (searchTerm && searchBy === 'title') {
        query.title = { $regex: escapeRegex(searchTerm), $options: 'i' };
    }
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
    }

    const foundListings = await Listing.find(query);
    res.render('listings/index.ejs', {
        allListings: foundListings,
        selectedCategory: category,
        searchTerm,
        searchBy,
        minPrice,
        maxPrice,
    });
};

// Render the form used to create a new listing.
module.exports.renderNewForm = (req, res) => {
    res.render('listings/new.ejs');
};

// Validate and save a listing owned by the signed-in user.
module.exports.createListing = async (req, res) => {
    const listing = normalizeListingBody(req.body);
    if (!listing || typeof listing !== 'object' || Array.isArray(listing)) {
        throw new AppError('Listing details are required.', 400);
    }

    if (req.file) {
        const uploadedImageUrl = req.file.path || req.file.secure_url || (req.file.filename ? `/uploads/${req.file.filename}` : '');
        if (uploadedImageUrl) {
            listing.image = { ...(listing.image && typeof listing.image === 'object' ? listing.image : {}), url: uploadedImageUrl };
        }
    }

    const validatedListing = validateListing(listing);
    const newListing = new Listing({
        ...validatedListing,
        owner: req.user._id,
    });
    await newListing.save();
    req.flash('success', 'Listing created successfully.');
    res.redirect(`/listings/${newListing._id}`);
};

// Load a listing with its reviews and reviewer names for the detail page.
module.exports.showListing = async (req, res) => {
    const foundListing = await Listing.findById(req.params.id)
        .populate({
            path: 'reviews',
            options: { sort: { createdAt: -1 } },
            populate: {
                path: 'author',
                select: 'username',
            },
        })
        .populate('owner');

    if (!foundListing) {
        req.flash('error', 'That listing no longer exists.');
        return res.redirect('/listings');
    }
    res.render('listings/show.ejs', { listing: foundListing });
};

// Allow only the listing owner to open the edit form.
module.exports.renderEditForm = async (req, res) => {
    const foundListing = await Listing.findById(req.params.id);
    if (!foundListing) {
        throw new AppError('The listing you want to edit was not found.', 404);
    }
    if (!foundListing.owner || foundListing.owner.toString() !== req.user._id.toString()) {
        req.flash('error', 'You are not the owner of this listing.');
        return res.redirect(`/listings/${req.params.id}`);
    }
    res.render('listings/edit.ejs', { listing: foundListing });
};

// Validate and update an existing listing after checking ownership.
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = normalizeListingBody(req.body);
    if (!listing || typeof listing !== 'object' || Array.isArray(listing)) {
        throw new AppError('Listing details are required.', 400);
    }

    if (req.file) {
        const uploadedImageUrl = req.file.path || req.file.secure_url || (req.file.filename ? `/uploads/${req.file.filename}` : '');
        if (uploadedImageUrl) {
            listing.image = { ...(listing.image && typeof listing.image === 'object' ? listing.image : {}), url: uploadedImageUrl };
        }
    }

    const existingListing = await Listing.findById(id);
    if (!existingListing) {
        throw new AppError('The listing you want to update was not found.', 404);
    }
    if (!existingListing.owner || existingListing.owner.toString() !== req.user._id.toString()) {
        req.flash('error', 'You are not the owner of this listing.');
        return res.redirect(`/listings/${id}`);
    }

    if (!req.file) {
        listing.image = { url: existingListing.image?.url || '' };
    }

    const validatedListing = validateListing(listing);
    const updatedListing = await Listing.findByIdAndUpdate(id, validatedListing, {
        returnDocument: 'after',
        runValidators: true,
    });
    if (!updatedListing) {
        throw new AppError('The listing you want to update was not found.', 404);
    }
    req.flash('success', 'Listing updated successfully.');
    res.redirect(`/listings/${updatedListing._id}`);
};

// Delete a listing only when the signed-in user owns it.
module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    const deletedListing = await Listing.findById(id);
    if (!deletedListing) {
        throw new AppError('The listing you want to delete was not found.', 404);
    }
    if (!deletedListing.owner || deletedListing.owner.toString() !== req.user._id.toString()) {
        req.flash('error', 'You are not the owner of this listing.');
        return res.redirect(`/listings/${id}`);
    }

    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing deleted successfully.');
    res.redirect('/listings');
};