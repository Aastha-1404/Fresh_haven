const Joi = require('joi');

const locationPattern = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/;
const listingCategories = ['farms', 'rooms', 'amazing-views', 'iconic-sites', 'beach', 'cabins'];

// Joi rules for listing data received from forms.
const listingSchema = Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(20).max(1000).required(),
    category: Joi.string().valid(...listingCategories).default('rooms'),
    image: Joi.object({
        filename: Joi.string().trim().max(200).allow(''),
        url: Joi.alternatives().try(
            Joi.string().trim().uri({ scheme: ['http', 'https'] }),
            Joi.string().pattern(/^\/uploads\/[A-Za-z0-9._-]+$/),
        ).allow(''),
    }).default({}),
    price: Joi.number().integer().min(1).max(1000000).required(),
    location: Joi.string().trim().min(2).max(80).pattern(locationPattern).required(),
    country: Joi.string().trim().min(2).max(80).pattern(locationPattern).required(),
}).required();

function validateListing(listing) {
    // Return cleaned values and convert validation failures into AppError-compatible errors.
    const { error, value } = listingSchema.validate(listing, {
        abortEarly: false,
        convert: true,
        stripUnknown: true,
    });

    if (error) {
        const message = error.details.map(detail => detail.message).join('; ');
        const validationError = new Error(message);
        validationError.statusCode = 400;
        validationError.name = 'RequestValidationError';
        throw validationError;
    }

    return value;
}

module.exports = validateListing;
