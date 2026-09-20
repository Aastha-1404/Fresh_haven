const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapasync.js');
const { requireLogin } = require('../middleware.js');
const reviewController = require('../controllers/review.js');

// Review creation and deletion are protected by login middleware.
router.route('/:id/reviews')
	.post(requireLogin('Please log in before adding a review.'), wrapAsync(reviewController.createReview));

router.route('/:listingId/reviews/:reviewId')
	.delete(requireLogin('Please log in before deleting a review.'), wrapAsync(reviewController.deleteReview));

module.exports = router;
