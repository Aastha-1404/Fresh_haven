const AppError = require('./utils/AppError.js');

// Add one-time success and error messages to the session.
function flashMessages(req, res, next) {
    req.flash = (type, message) => {
        req.session.flash = req.session.flash || {};

        if (message === undefined) {
            const messages = req.session.flash[type] || [];
            delete req.session.flash[type];
            return messages;
        }

        req.session.flash[type] = req.session.flash[type] || [];
        req.session.flash[type].push(message);
        return req.session.flash[type];
    };

    next();
}

// Accept only local paths that cannot create an external redirect.
function isSafeRedirectUrl(path) {
    return typeof path === 'string'
        && path.startsWith('/')
        && !path.startsWith('//')
        && !path.startsWith('/users/login');
}

// Require authentication before protected actions can continue.
function requireLogin(message = 'Please log in to continue.') {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            const redirectUrl = isSafeRedirectUrl(req.originalUrl) ? req.originalUrl : '/listings';
            req.session.redirecturl = redirectUrl;
            req.flash('error', message);
            return res.redirect(`/users/login?redirecturl=${encodeURIComponent(redirectUrl)}`);
        }
        next();
    };
}

// Expose flash messages and the signed-in user to all templates.
function setResponseLocals(req, res, next) {
    res.locals.success = req.flash('success') || [];
    res.locals.error = req.flash('error') || [];
    res.locals.currentUser = req.user || null;
    next();
}

// Convert unmatched requests into a standard application error.
function handleNotFound(req, res, next) {
    next(new AppError('The page you requested could not be found.', 404));
}

// Convert known errors into HTML pages or JSON responses.
function handleErrors(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong. Please try again.';

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'The listing ID is not valid.';
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Please check the listing details and try again.';
    }

    if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'The submitted data is too large.';
    }

    if (err.name === 'MulterError') {
        statusCode = 400;
        message = err.code === 'LIMIT_FILE_SIZE'
            ? 'The image must be smaller than 5 MB.'
            : 'Please upload a valid image file.';
    }

    console.error(`${statusCode} ${req.method} ${req.originalUrl}`, err);

    if (req.accepts('html')) {
        return res.status(statusCode).render('error.ejs', {
            statusCode,
            message,
            currentUser: req.user || res.locals.currentUser || null,
            success: res.locals.success || [],
            error: res.locals.error || [],
        });
    }

    res.status(statusCode).json({ error: message });
}

module.exports = {
    flashMessages,
    isSafeRedirectUrl,
    requireLogin,
    setResponseLocals,
    handleNotFound,
    handleErrors,
};
