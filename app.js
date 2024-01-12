// Dependencies
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
// const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const morgan = require('morgan');
const compression = require('compression');
// const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
// const middleware = require('./middleware');

// Utilities
const AppError = require('./system/utils/appError');
// const languageManager = require('./system/utils/languageManager');

// Routers
const viewRoutes = require('./system/routes/viewRoutes');
const postRoutes = require('./system/routes/postRoutes');
const userRoutes = require('./system/routes/userRoutes');
const notificationRoutes = require('./system/routes/notificationRoutes');
const chatRoutes = require('./system/routes/chatRoutes');
const messageRoutes = require('./system/routes/messageRoutes');

// Controllers
const errorController = require('./system/controllers/errorController');

// Initialise express
const app = express();

// If in production, catch unauthorised requests and kill them
app.all('*', (req, res, next) => {
	if (process.env.NODE_ENV === 'production') {
		// Set strict whitelist of hosts that can access the system
		const whitelist = ['localhost:3000', 'jabber.ap-northeast-1.elasticbeanstalk.com'];

		// Check if current host is whitelisted
		if (whitelist.includes(req.headers.host)) {
			// Redirect authorised www traffic to non-www
			if (req.headers.host.match(/^www/) !== null) {
				return res.redirect(`https://${req.headers.host.replace(/^www\./, '')}${req.url}`);
			}
			return next();
		}

		// UNAUTHORISED ACCESS DETECTED
		// Uncomment the next line to log anuthorised requests
		console.log(`${req.method} ${req.originalUrl} blocked from ${req.headers.host}`);
		// Kill the request
		return res.status(403).end();
	}
	next();
});

// Set nonce to be used in requests for public js files
app.use((req, res, next) => {
	res.locals.nonce = crypto.randomBytes(16).toString('hex');
	next();
});

// Set content security policy HTTP headers
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:', 'wss:', 'blob:'],
			baseUri: ["'self'"],
			fontSrc: ["'self'", 'https:', 'http:', 'data:'],
			scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, 'https:', 'http:', 'blob:'],
			styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
		},
	})
);

// Prevent use of system in iframe
app.use(helmet.frameguard({ action: 'deny' }));

// Prevent mime-based attacks
app.use(helmet.noSniff());

// Tell browsers that this site should only be access with HTTPS
app.use(helmet.hsts({ maxAge: 63072000, includeSubDomains: true }));

// Disable x-powered to avoid sending out server details
app.disable('x-powered-by');

// Set render engines
// app.set('view engine', 'ejs');
app.set('view engine', 'pug');

// Set location of public views and static files
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'public')));

// Start a session for the user
app.use(
	session({
		cookie: { maxAge: 86400000 },
		store: new MemoryStore({
			checkPeriod: 86400000, // prune expired entries every 24h
		}),
		resave: false,
		secret: process.env.SESSION_SECRET,
		saveUninitialized: false,
	})
);

// Use morgan in development to show status codes in terminal
if (process.env.NODE_ENV === 'test') {
	app.use(morgan('dev'));
}

// Rate limiter to prevent DNS and brute force attacks
// TODO: Need to rethink this because there are a lot of calls
// const limiter = rateLimit({
// 	max: 200,
// 	windowMs: 60 * 60 * 1000,
// 	message: 'Too many requests from this IP. Please try again in an hour!',
// });
// app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// DATA SANITISATION
// Remove mongoDB type code to prevent NoSQL query injection
app.use(mongoSanitize());
// Remove HTML type code from inputs to prevent XSS cross-scripting attacks
// app.use(xss());
// Prevent parameter pollution
app.use(hpp({ whiteList: [] }));

// Compression for better live performance
app.use(compression());

// Health check route for AWS
app.use('/healthcheck', (req, res) => {
	res.status(200).send('ok');
});

// Declare routers in order to mount them and set routes
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/', viewRoutes);

// Clean error reporting
app.all('*', (req, res, next) => {
	// const errorMessage = languageManager(req, res, '404');
	const errorMessage = 'Something went wrong';
	next(new AppError(errorMessage, 404));
});

app.use(errorController);

module.exports = app;
