// --- DEPENDENCIES ---

// --- MODELS ---

// --- UTILITIES ---

const AppError = require('../utils/appError');

// --- CONTROLLER FUNCTIONS ---

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}.`;
	return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
	const value = Object.values(err.keyValue)[0];
	const message = `Duplicate field value: ${value}. Please use another value`;
	return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
	const errors = Object.values(err.errors).map((el) => el.message);
	const message = `Invalid input data. ${errors.join('. ')}`;
	return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
	// API
	if (req.originalUrl.startsWith('/api')) {
		res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack,
		});
	} else {
		// RENDERED WEBSITE
		const errorButton = req.headers.referer && req.headers.referer.includes('localhost') ? 'error_back' : 'error_login';
		res.status(err.statusCode).render('error', {
			title: 'Something went wrong',
			message: err.message,
			errorButton,
		});
	}
};

const sendErrorProd = (err, req, res) => {
	// API
	if (req.originalUrl.startsWith('/api')) {
		if (err.isOperational) {
			// Operational, trusted error - send message to client
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});
		}
		// Programming or other unknown error - don't send message to client
		// 1) Log error to console
		// eslint-disable-next-line no-console
		console.log(`ERROR: `, err);
		// 2) Send generic error
		return res.status(500).json({
			status: 'error',
			message: 'Something went wrong',
		});
	}

	// RENDERED WEBSITE
	// Operational, trusted error: send message to client
	if (err.isOperational) {
		// Operational, trusted error - send message to client
		const errorButton = req.headers.referer && req.headers.referer.includes('localhost') ? 'error_back' : 'error_login';

		return res.status(err.statusCode).render('error', {
			title: 'Something went wrong.',
			message: err.message,
			errorButton,
		});
	}
	// Programming or other unknown error - don't send message to client
	// 1) Log error to console
	// eslint-disable-next-line no-console
	console.log('ERROR: ', err);
	// 2) Send generic error
	const errorButton = req.headers.referer && req.headers.referer.includes('localhost') ? 'error_back' : 'error_login';

	return res.status(err.statusCode).render('error', {
		title: 'Something went wrong.',
		message: 'Please try again later',
		errorButton,
	});
};

const handleJWTErrorDB = () => new AppError('Invalid token, please log in again.', 401);

const handleJWTExpiredErrorDB = () => new AppError('Token expired', 401);

// --- GENERATE PAGES ---

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(err, req, res);
	} else if (process.env.NODE_ENV === 'production') {
		let error = Object.create(err);
		if (err.name === 'CastError') error = handleCastErrorDB(err);
		if (error.code === 11000) error = handleDuplicateFieldsDB(err);
		if (error.name === 'ValidationError') error = handleValidationErrorDB(err);
		if (err.name === 'JsonWebTokenError') error = handleJWTErrorDB();
		if (err.name === 'TokenExpiredError') error = handleJWTExpiredErrorDB();
		sendErrorProd(error, req, res);
	}
};
