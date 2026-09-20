const User = require('../models/user.js');
const { isSafeRedirectUrl } = require('../middleware.js');

// Show the account creation form.
module.exports.renderSignupForm = (req, res) => {
	res.render('users/signup');
};

// Show the login form and preserve a safe post-login destination.
module.exports.renderLoginForm = (req, res) => {
	if (isSafeRedirectUrl(req.query.redirecturl)) {
		req.session.redirecturl = req.query.redirecturl;
	} else if (req.query.retry !== '1') {
		delete req.session.redirecturl;
	}

	res.render('users/login', {
		redirecturl: isSafeRedirectUrl(req.session.redirecturl) ? req.session.redirecturl : '',
	});
};

// Validate signup data and create a new local-authenticated user.
module.exports.signup = async (req, res) => {
	const { username, email, password, confirmPassword } = req.body;

	if (!username || !email || !password) {
		req.flash('error', 'Please complete all signup fields.');
		return res.redirect('/users/signup');
	}

	const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
	if (!strongPassword.test(password)) {
		req.flash('error', 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.');
		return res.redirect('/users/signup');
	}

	if (password !== confirmPassword) {
		req.flash('error', 'Passwords do not match.');
		return res.redirect('/users/signup');
	}

	try {
		const user = new User({ username, email });
		await User.register(user, password);
	} catch (error) {
		if (error.code === 11000 || error.name === 'UserExistsError') {
			req.flash('error', 'An account with that username or email already exists.');
			return res.redirect('/users/signup');
		}
		throw error;
	}

	req.flash('success', 'Welcome to Fresh Haven!');
	res.redirect('/listings');
};

// Save a safe redirect before Passport authenticates the credentials.
module.exports.prepareLogin = (req, res, next) => {
	if (isSafeRedirectUrl(req.query.redirecturl)) {
		req.session.redirecturl = req.query.redirecturl;
	}
	next();
};

// Finish a successful Passport login and redirect the user.
module.exports.login = (req, res) => {
	req.flash('success', 'Welcome back to Fresh Haven!');
	const redirectUrl = isSafeRedirectUrl(req.query.redirecturl)
		? req.query.redirecturl
		: isSafeRedirectUrl(req.session.redirecturl)
			? req.session.redirecturl
			: '/listings';
	delete req.session.redirecturl;
	res.redirect(redirectUrl);
};

// End the Passport session and return to the listings page.
module.exports.logout = (req, res, next) => {
	req.logout((error) => {
		if (error) {
			return next(error);
		}
		req.flash('success', 'You have been logged out.');
		res.redirect('/listings');
	});
};
