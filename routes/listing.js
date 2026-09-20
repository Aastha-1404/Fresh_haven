const express = require('express');
const multer = require('multer');
const router = express.Router();
const wrapAsync = require('../utils/wrapasync.js');
const { requireLogin } = require('../middleware.js');
const listingController = require('../controllers/listing.js');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// Listing routes delegate business logic to the listing controller.
router.route('/')
	.get(wrapAsync(listingController.index))
	.post(requireLogin('Please log in before creating a listing.'), upload.single('image'), wrapAsync(listingController.createListing));

// Require login before displaying the create form.
router.get('/new', requireLogin('Please log in before creating a listing.'), listingController.renderNewForm);

// Public listing detail page.
router.route('/:id')
	.get(wrapAsync(listingController.showListing))
	.put(requireLogin('Please log in before editing a listing.'), upload.single('image'), wrapAsync(listingController.updateListing))
	.delete(requireLogin('Please log in before deleting a listing.'), wrapAsync(listingController.deleteListing));

// Owner-protected edit form and update action.
router.get('/:id/edit', requireLogin('Please log in before editing a listing.'), wrapAsync(listingController.renderEditForm));

module.exports = router;