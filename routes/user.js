const express=require('express');
const router=express.Router();
const passport=require('passport');
const wrapAsync=require('../utils/wrapasync.js');
const userController = require('../controllers/user.js');

// Public account pages and account actions.
router.route('/signup')
	.get(userController.renderSignupForm)
	.post(wrapAsync(userController.signup));

router.route('/login')
	.get(userController.renderLoginForm)
	.post(userController.prepareLogin, passport.authenticate('local', {
		failureRedirect: '/users/login?retry=1',
		failureFlash: 'Invalid username or password. Please enter valid details or sign up first.',
	}), userController.login);

router.post('/logout', userController.logout);

module.exports=router;