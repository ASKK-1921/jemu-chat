// DEPENDENCIES
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const AppError = require('../utils/appError');
const Notification = require('../models/notificationModel');

// CONTROLLER FUNCTIONS
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
// GET POST DATA
exports.getFilteredPosts = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { query } = req;
	// Check if we should filter by type "Reply"
	if (query.isReply !== undefined) {
		const isReply = query.isReply === 'true';
		query.replyTo = { $exists: isReply };
		delete query.isReply;
	}
	// Check if we are using the general search option
	if (query.search !== undefined) {
		query.content = { $regex: query.search, $options: 'i' };
		delete query.search;
	}
	// Check if we should filter to only posts for users we are following
	if (query.followingOnly !== undefined) {
		const followingOnly = query.followingOnly === 'true';
		if (followingOnly) {
			const objectIdArray = [];
			if (!req.session.user.following) {
				req.session.user.following = [];
			}

			req.session.user.following.forEach((user) => {
				objectIdArray.push(user);
			});

			objectIdArray.push(req.session.user._id);
			query.postedBy = { $in: objectIdArray };
		}
		delete query.followingOnly;
	}

	// Return the filtered results
	const results = await getPosts(query);
	res.status(200).send(results);
});

// CREATE A NEW POST
exports.createPost = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { content } = req.body;
	const { user } = req.session;
	const { replyTo } = req.body;

	// Confirm the necessary details exist
	if (!content) {
		return next(new AppError('Error while creating new post.', 400));
	}

	// Prepare the postData for creating the new post
	const postData = {
		content,
		postedBy: user,
	};

	// Flag the new post as a reply if appropriate
	if (replyTo) {
		postData.replyTo = replyTo;
	}

	// Create the new post data and populate the User and Post models
	Post.create(postData)
		.then(async (newPost) => {
			newPost = await User.populate(newPost, { path: 'postedBy' });
			newPost = await Post.populate(newPost, { path: 'replyTo' });

			// Send a notification to the original poster if this is a reply
			if (newPost.replyTo !== undefined) {
				await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, 'reply', newPost._id);
			}

			// Send the new post data back
			res.status(201).send(newPost);
		})
		.catch((error) => {
			console.log(error);
			res.sendStatus(400);
		});
});

// GET A SINGLE POST
exports.getSinglePost = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { id } = req.params;

	// Find the post requested by the id parameter
	let postData = await getPosts({ _id: id });
	postData = postData[0];

	// Confirm there is a post and return an error if not
	if (!postData) {
		return res.sendStatus(204);
	}

	// Form the results object with the postData
	const results = { postData };

	// Attach the replyTo data if applicable
	if (postData.replyTo !== null) {
		results.replyTo = postData.replyTo;
	}

	// If there are replies, attach them to the results object
	results.replies = await getPosts({ replyTo: id });

	// Send back the results object
	res.status(200).send(results);
});

// UPDATE THE PINNED POST
exports.updatePinnedPost = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { pinned } = req.body;
	const { user } = req.session;
	const { id } = req.params;

	// Confirm the pinned post data is present and remove other pins if necessary
	if (pinned !== undefined) {
		await Post.updateMany({ postedBy: user }, { pinned: false }).catch((error) => {
			console.log(error);
			res.sendStatus(400);
		});
	}

	// Update the pinned value on the target post
	const updatedPost = await Post.findByIdAndUpdate(id, req.body);

	if (!updatedPost) {
		console.log('Could not update post');
		res.sendStatus(400);
	}
	res.sendStatus(204);
});

// DELETE A SELECTED POST
exports.deletePost = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { id } = req.params;

	// Delete posts that have replied to or shared the original post
	const deleteReplies = await Post.deleteMany({ replyTo: id });
	const deleteShares = await Post.deleteMany({ shareData: id });

	// If all connected posts were deleted successfully, delete the original post
	if (deleteReplies.acknowledged && deleteShares.acknowledged) {
		Post.findByIdAndDelete(id)
			.then(() => res.sendStatus(202))
			.catch((error) => {
				console.log(error);
				res.sendStatus(400);
			});
	}
});

// TOGGLE LIKE ON A SPECIFIC POST
exports.toggleLikeForPost = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { postId } = req.params;
	const userId = req.session.user._id;

	// Check if the post has already been liked by the current user
	const isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

	// Change the action based on whether the post has already been liked or not
	const option = isLiked ? '$pull' : '$addToSet';

	// Insert/remove the like on the user's records
	req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true }).catch(
		(error) => {
			console.log(error);
			res.sendStatus(400);
		}
	);

	// Insert/remove the like on the post's records
	const post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true }).catch((error) => {
		console.log(error);
		res.sendStatus(400);
	});

	// If the action is to like the post, send a notification to the original poster
	if (!isLiked) {
		await Notification.insertNotification(post.postedBy, userId, 'postLike', post._id);
	}

	res.status(200).send(post);
});

exports.toggleShareForPost = catchAsync(async (req, res, next) => {
	// Assign values to clear variables
	const { postId } = req.params;
	const userId = req.session.user._id;

	// Delete the share if it's already been shared
	const deletedPost = await Post.findOneAndDelete({
		postedBy: userId,
		shareData: postId,
	}).catch((error) => {
		console.log(error);
		res.sendStatus(400);
	});

	// Change the action based on whether the post has already been shared or not
	const option = deletedPost ? '$pull' : '$addToSet';

	let repost = deletedPost;

	if (repost == null) {
		repost = await Post.create({ postedBy: userId, shareData: postId }).catch((error) => {
			console.log(error);
			res.sendStatus(400);
		});
	}

	// Insert/remove the share on the user's records
	req.session.user = await User.findByIdAndUpdate(userId, { [option]: { shares: repost._id } }, { new: true }).catch(
		(error) => {
			console.log(error);
			res.sendStatus(400);
		}
	);

	// Insert/remove the share on the post's records
	const post = await Post.findByIdAndUpdate(postId, { [option]: { shareUsers: userId } }, { new: true }).catch(
		(error) => {
			console.log(error);
			res.sendStatus(400);
		}
	);

	// If the action is to share the post, send a notification to the original poster
	if (!deletedPost) {
		await Notification.insertNotification(post.postedBy, userId, 'share', post._id);
	}

	res.status(200).send(post);
});
