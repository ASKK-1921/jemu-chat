// DEPENDENCIES
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const renderPage = require('../utils/renderPage');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Post = require('../models/postModel');

// CONTROLLER FUNCTIONS
// Allow for loading profiles with either username or ID
async function getPayload(username) {
	// First, check with the username
	let user = await User.findOne({ username });

	// If no user found, then check with the ID
	if (!user) {
		// Ensure the string is a valid ObjectId
		const { ObjectId } = mongoose.Types;
		if (!ObjectId.isValid(username)) {
			return {
				pageTitle: 'User not found',
			};
		}

		// Search for the user with the ID
		user = await User.findById(username);
		if (!user) {
			return {
				pageTitle: 'User not found',
			};
		}
	}

	// Send back the relevant pageTitle and user information
	return {
		pageTitle: user.username,
		profileUser: user,
	};
}

const getChatByUserId = (userLoggedInId, otherUserId) => {
	return Chat.findOneAndUpdate(
		{
			isGroupChat: false,
			users: {
				$size: 2,
				$all: [
					{ $elemMatch: { $eq: new mongoose.Types.ObjectId(userLoggedInId) } },
					{ $elemMatch: { $eq: new mongoose.Types.ObjectId(otherUserId) } },
				],
			},
		},
		{ $setOnInsert: { users: [userLoggedInId, otherUserId] } },
		{
			new: true,
			upsert: true,
		}
	).populate('users');
};

const getPosts = async (filter) => {
	let results = await Post.find(filter)
		.populate('postedBy')
		.populate('shareData')
		.populate('replyTo')
		.sort({ createdAt: -1 });

	results = await User.populate(results, { path: 'replyTo.postedBy' });
	return await User.populate(results, { path: 'shareData.postedBy' });
};

// EXPORTS
// Login
exports.getLoginPage = (req, res, next) => {
	renderPage(req, res, 200, 'login');
};

// Register
exports.getRegisterPage = (req, res, next) => {
	renderPage(req, res, 200, 'register');
};

// Main page
exports.getHomePage = (req, res, next) => {
	renderPage(req, res, 200, 'home');
};

// My profile
exports.getProfilePage = (req, res, next) => {
	// Assign values to clear variables
	const { user } = req.session;
	const { username } = user;

	// Set the current user details
	const payload = {
		pageTitle: username,
		profileUser: user,
		activeUser: req.session.user,
	};

	// Render the page
	renderPage(req, res, 200, 'profile', payload);
};

// Other user's profile
exports.getUserProfilePage = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { username } = req.params;

	// Get the payload dynamically
	const payload = await getPayload(username);
	payload.activeUser = req.session.user;

	// Render the page
	renderPage(req, res, 200, 'profile', payload);
});

// Get list of data on a user's profile page
exports.getProfileDetailsPage = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { username } = req.params;
	const { dataType } = req.params;
	let pageFile = 'profile';

	// Get the payload dynamically
	const payload = await getPayload(username);
	payload.activeUser = req.session.user;

	if (dataType === 'replies' || dataType === 'following' || dataType === 'followers') {
		payload.selectedTab = dataType;
	} else {
		res.redirect('/profile');
	}

	if (dataType === 'following' || dataType === 'followers') {
		pageFile = 'followersAndFollowing';
	}

	// Render the page
	renderPage(req, res, 200, pageFile, payload);
});

// Single posts
exports.getSinglePostPage = (req, res, next) => {
	const payload = {
		pageTitle: 'View Post',
		postId: req.params.id,
	};
	renderPage(req, res, 200, 'post', payload);
};

// Notifications
exports.getNotificationsPage = (req, res, next) => {
	renderPage(req, res, 200, 'notifications');
};

// Inbox
exports.getInboxPage = (req, res, next) => {
	renderPage(req, res, 200, 'inbox');
};

exports.getSingleChat = catchAsync(async (req, res, next) => {
	const userId = req.session.user._id;
	const { chatId } = req.params;
	const isValidId = mongoose.isValidObjectId(chatId);

	const payload = {};

	if (!isValidId) {
		payload.errorMessage = 'Chat does not exist or you do not have permission to view it';
		return res.status(200).render('chat', payload);
	}

	let chat = await Chat.findOne({
		_id: chatId,
		users: { $elemMatch: { $eq: userId } },
	}).populate('users');

	if (chat == null) {
		const userFound = await User.findById(chatId);
		if (userFound != null) {
			chat = await getChatByUserId(userFound._id, userId);
		}
	}

	if (chat == null) {
		payload.errorMessage = 'Chat does not exist or you do not have permission to view it';
	} else {
		payload.chat = chat;
	}

	renderPage(req, res, 200, 'chat', payload);
});

exports.getNewChatPage = (req, res, next) => {
	const payload = { pageTitle: 'New Message' };
	renderPage(req, res, 200, 'newMessage', payload);
};

exports.getSingleChatPage = catchAsync(async (req, res, next) => {
	const userId = req.session.user._id;
	const { chatId } = req.params;
	const isValidId = mongoose.isValidObjectId(chatId);

	const payload = {};

	if (!isValidId) {
		payload.errorMessage = 'Chat does not exist or you do not have permission to view it';
		renderPage(req, res, 200, 'chat', payload);
	}

	let chat = await Chat.findOne({
		_id: chatId,
		users: { $elemMatch: { $eq: userId } },
	}).populate('users');

	if (chat == null) {
		const userFound = await User.findById(chatId);
		if (userFound != null) {
			chat = await getChatByUserId(userFound._id, userId);
		}
	}

	if (chat == null) {
		payload.errorMessage = 'Chat does not exist or you do not have permission to view it';
	} else {
		payload.chat = chat;
	}

	renderPage(req, res, 200, 'chat', payload);
});

exports.getSearchPage = (req, res, next) => {
	renderPage(req, res, 200, 'search');
};

exports.getSearchTabPage = (req, res, next) => {
	const payload = { selectedTab: req.params.selectedTab };
	renderPage(req, res, 200, 'search', payload);
};

exports.getSinglePost = catchAsync(async (req, res, next) => {
	const postId = req.params.id;
	let postData = await getPosts({ _id: postId });
	postData = postData[0];

	const results = {
		postData: postData,
	};

	if (!postData) {
		return res.sendStatus(204);
	}

	if (postData.replyTo != null) {
		results.replyTo = postData.replyTo;
	}

	results.replies = await getPosts({ replyTo: postId });

	res.status(200).send(results);
});
