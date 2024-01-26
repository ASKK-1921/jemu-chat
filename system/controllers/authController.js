// DEPENDENCIES
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const renderPage = require('../utils/renderPage');
const sendGrid = require('../utils/sendGrid');

// EXPORTS
// REQUIRE LOG IN BEFORE PROCEEDING
exports.requireLogin = catchAsync(async (req, res, next) => {
	if (req.session && req.session.user) {
		return next();
	}
	return res.redirect('/login');
});

// NEW USER SIGNUP
exports.register = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { password } = req.body;
	const { confirmPassword } = req.body;
	const firstName = req.body.firstName.trim();
	const lastName = req.body.lastName.trim();
	const username = req.body.username.trim();
	const email = req.body.email.trim();

	// Create the default payload (used for reloading the page if needed)
	const payload = { firstName, lastName, username, email };

	const numberOfUsers = await User.countDocuments();
	if (numberOfUsers >= 10) {
		payload.errorMessage = 'Sorry, we are not accepting any more new users at this time. Please try again later.';
		return renderPage(req, res, 409, 'register', payload);
	}

	// Confirm the necessary details exist
	if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
		// Necessary details not supplied, so reload with data and message
		payload.errorMessage = 'Make sure each field has a valid value';
		res.status(200).render('register', payload);
	}

	// Check if a user exists with the supplied username or email
	const alreadExists = await User.findOne({
		$or: [{ username: username }, { email: email }],
	});

	// Send back an error if the username or email is already in use
	if (alreadExists) {
		payload.errorMessage = 'This username or email already exists';
		return renderPage(req, res, 409, 'register', payload);
	}

	// If we made it here, everything is unique so create new user
	const newUser = await User.create(req.body);

	// Confirm the user was created or return error
	if (!newUser) {
		return next(new AppError('Error while creating new user.', 400));
	}

	const url = `${req.protocol}://${req.get('host')}/login/${newUser.id}/${newUser.accountActivationToken}`;
	// Sendgrid email with /mail
	const templateId = process.env.SENDGRID_CONFIRM_EMAIL_TEMPLATE;
	const templateData = {
		username: newUser.username,
		confirm_email_link: url,
	};
	sendGrid.sendEmail(templateId, newUser, templateData);

	const confirmEmailpayload = {
		activateLogin: true,
	};

	renderPage(req, res, 200, 'register', confirmEmailpayload);
});

// LOG IN
exports.login = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { logUsername } = req.body;
	const { logPassword } = req.body;

	// Create the default payload (used for reloading the page if needed)
	const payload = { logUsername };

	// Confirm the necessary details exist
	if (!logUsername || !logPassword) {
		payload.errorMessage = 'Make sure each field has a valid value';
		return renderPage(req, res, 400, 'login', payload);
	}

	// Search for user based on either the registered username or registered email
	const user = await User.findOne({
		$or: [{ username: logUsername }, { email: logUsername }],
	}).select('+password');

	if (user.active === false) {
		payload.errorMessage = 'Please confirm your email before logging in';
		return renderPage(req, res, 401, 'login', payload);
	}

	// Confirm the entered password matches the one on file for the user
	if (!user || !(await user.correctPassword(logPassword, user.password))) {
		payload.errorMessage = 'Login credentials incorrect';
		return renderPage(req, res, 401, 'login', payload);
	}

	// Set the user data to the session data and load the home page
	req.session.user = user;
	return res.redirect('/');
});

exports.activate = catchAsync(async (req, res, next) => {
	const { logUsername } = req.body;
	const { logPassword } = req.body;
	const activationToken = req.url.split('/').pop();

	// Create the default payload (used for reloading the page if needed)
	const payload = { logUsername };

	// Confirm the necessary details exist
	if (!logUsername || !logPassword) {
		payload.errorMessage = 'Make sure each field has a valid value';
		return renderPage(req, res, 400, 'login', payload);
	}

	if (!activationToken) {
		// TODO: Handle this kind of error
		payload.errorMessage = 'Unexpected error has occurred';
		return renderPage(req, res, 400, 'login', payload);
	}

	// Search for user based on either the registered username or registered email
	const user = await User.findOne({
		$or: [{ username: logUsername }, { email: logUsername }],
	}).select('+password');

	// Confirm the entered password matches the one on file for the user
	if (!user || !(await user.correctPassword(logPassword, user.password))) {
		payload.errorMessage = 'Login credentials incorrect';
		return renderPage(req, res, 401, 'login', payload);
	}

	// Confirm the activationToken matches the one on file for the user
	if (user.accountActivationToken !== activationToken) {
		return next(new AppError('(E-58) Error with activation token.', 400));
	}

	user.accountActivationToken = undefined;
	user.active = true;

	await user.save({ validateBeforeSave: false });

	// Send welcome email
	const templateId = 'd-b3875fef526c413da96db8dd7a8d1ce8';
	const templateData = {
		username: user.username,
	};

	sendGrid.sendEmail(templateId, user, templateData);
	// sendGrid.addToContacts(user);

	// Set the user data to the session data and load the home page
	req.session.user = user;
	return res.redirect('/');
});

exports.logout = (req, res, next) => {
	if (req.session) {
		req.session.destroy(() => {
			res.redirect('/login');
		});
	}
};
