/* eslint-disable no-console */
// DEPENDENCIES
const multer = require('multer');
const sharp = require('sharp');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const s3Upload = require('../utils/s3Upload');

// CONTROLLER FUNCTIONS
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('(E-28) Incorrect file type, please upload only images or PDF files.', 400));
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

// EXPORTS
// Get a single user
exports.getUsers = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	let searchObj = req.query;

	// Set up the search filters if present
	if (req.query.search !== undefined) {
		searchObj = {
			$or: [
				{ firstName: { $regex: req.query.search, $options: 'i' } },
				{ lastName: { $regex: req.query.search, $options: 'i' } },
				{ username: { $regex: req.query.search, $options: 'i' } },
			],
		};
	}

	// Find the users with the given serach parameters
	const users = await User.find(searchObj);

	// Send error if no user found
	if (!users) {
		return res.sendStatus(404);
	}

	// Send back the user
	res.status(200).send(users);
});

// Follow/unfollow another user
exports.followUser = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { userId } = req.params;

	// Find the user
	const user = await User.findById(userId);

	// Send error if no user found
	if (!user) {
		return res.sendStatus(404);
	}

	// Check if we're already following the user and adjust the action accordingly
	const isFollowing = user.followers && user.followers.includes(req.session.user._id);
	const option = isFollowing ? '$pull' : '$addToSet';

	// Update the currently logged in user
	req.session.user = await User.findByIdAndUpdate(
		req.session.user._id,
		{ [option]: { following: userId } },
		{ new: true }
	);

	// Update the target user
	const targetUser = await User.findByIdAndUpdate(
		userId,
		{
			[option]: { followers: req.session.user._id },
		},
		{ new: true }
	);

	if (!targetUser) {
		console.log('An error occured while toggling the follow on the target user');
		res.sendStatus(400);
	}

	// Send a notification to the target user if they are now being followed
	if (!isFollowing) {
		await Notification.insertNotification(userId, req.session.user._id, 'follow', req.session.user._id);
	}

	// Send back the new logged in user details
	res.status(200).send(req.session.user);
});

// Get list of who the user is following
exports.getFollowing = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { userId } = req.params;

	// Find the user and populate the following array
	const user = await User.findById(userId).populate('following');

	// Send back the list of who the user is following

	res.status(200).send(user.following);
});

// Get list of who is following the user
exports.getFollowers = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { userId } = req.params;

	// Find the user and populate the followers array
	const user = await User.findById(userId).populate('followers');

	// Send back the list of who is following the user
	res.status(200).send(user.followers);
});

// Upload files with multer
exports.uploadFile = upload.single('croppedImage');

exports.updateImageData = catchAsync(async (req, res, next) => {
	const { imageType } = req.body;

	const validImageTypeRequest = imageType === 'profilePicture' ? true : imageType === 'coverPhoto';

	if (!validImageTypeRequest) {
		console.log('Incorrect fileType specified in request');
		return res.sendStatus(400);
	}

	if (!req.file) {
		console.log('No file uploaded with ajax request');
		return res.sendStatus(400);
	}

	const filePath = `userimages`;

	const fileName = `${req.session.user._id}_${imageType}`;

	const data = await sharp(req.file.buffer).toFormat('png').png({ quality: 90 });

	const destination = `${filePath}/${fileName}.png`;

	await s3Upload(data, destination, req.file.mimetype);

	req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [imageType]: destination }, { new: true });
	res.sendStatus(204);
});
