const Listing = require('../models/listing.js');
const Review = require('../models/review.js');
const Joi = require('joi');
const AppError = require('../utils/AppError.js');

const reviewSchema = Joi.object({
	rating: Joi.number().integer().min(1).max(5).required(),
	comment: Joi.string().trim().min(3).max(500).required(),
});

// Validate, save, and attach a review to its listing.
module.exports.createReview = async (req, res) => {
	const { id } = req.params;
	const listing = await Listing.findById(id).populate({
		path: 'reviews',
		options: { sort: { createdAt: -1 } },
		populate: {
			path: 'author',
			select: 'username',
		},
	});

	if (!listing) {
		throw new AppError('The listing you requested was not found.', 404);
	}

	const rawReview = req.body.review || {
		rating: req.body.rating,
		comment: req.body.comment,
	};

	if (!rawReview || typeof rawReview !== 'object' || Array.isArray(rawReview)) {
		return res.status(400).render('listings/show.ejs', {
			listing,
			success: [],
			error: ['Review details are required.'],
		});
	}

	const { error, value } = reviewSchema.validate(rawReview, { abortEarly: false });
	if (error) {
		return res.status(400).render('listings/show.ejs', {
			listing,
			success: [],
			error: error.details.map((detail) => detail.message),
		});
	}

	let review;
	try {
		review = await Review.create({
			rating: value.rating,
			comment: value.comment,
			author: req.user._id,
		});

		const updatedListing = await Listing.findByIdAndUpdate(
			id,
			{ $push: { reviews: review._id } },
			{ new: true, runValidators: true },
		);

		if (!updatedListing) {
			throw new AppError('The listing you requested was not found.', 404);
		}
	} catch (error) {
		if (review) {
			await Review.findByIdAndDelete(review._id);
		}
		throw error;
	}

	req.flash('success', 'Review added successfully.');
	res.redirect(`/listings/${listing._id}`);
};

// Remove a review only when the signed-in user authored it.
module.exports.deleteReview = async (req, res) => {
	const { listingId, reviewId } = req.params;
	const listing = await Listing.findById(listingId);

	if (!listing) {
		throw new AppError('The listing you requested was not found.', 404);
	}

	const review = await Review.findById(reviewId);
	if (!review) {
		throw new AppError('The review you want to delete was not found.', 404);
	}

	const isReviewAuthor = review.author
		&& review.author.toString() === req.user._id.toString();
	if (!isReviewAuthor) {
		req.flash('error', 'You do not have permission to delete this review.');
		return res.redirect(`/listings/${listingId}`);
	}

	await Listing.findByIdAndUpdate(listingId, {
		$pull: { reviews: reviewId },
	});
	await Review.findByIdAndDelete(reviewId);

	req.flash('success', 'Review deleted successfully.');
	res.redirect(`/listings/${listingId}`);
};
