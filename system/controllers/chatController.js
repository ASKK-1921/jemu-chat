const catchAsync = require('../utils/catchAsync');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const messageEncryption = require('../utils/messageEncryption');

exports.getAllChats = catchAsync(async (req, res, next) => {
	const { query } = req;
	const inboxType = query.inboxType === 'groups';

	let chats = await Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } }, isGroupChat: { $eq: inboxType } })
		.populate('users')
		.populate('latestMessage')
		.sort({ updatedAt: -1 });

	if (!chats) {
		console.log('Could not find chats');
		return res.status(404);
	}

	if (req.query.unreadOnly !== undefined && req.query.unreadOnly === 'true') {
		chats = chats.filter((r) => r.latestMessage && !r.latestMessage.readBy.includes(req.session.user._id));
	}

	await chats.forEach(async (chat) => {
		if (chat.latestMessage.vector) {
			chat.latestMessage.content = await messageEncryption.decrypt(
				chat.latestMessage.content,
				chat.latestMessage.vector
			);
		}
	});

	chats = await User.populate(chats, { path: 'latestMessage.sender' });

	res.status(200).send(chats);
});

exports.createChat = catchAsync(async (req, res, next) => {
	if (!req.body.users) {
		console.log('Users parameter not sent with request');
		return res.sendStatus(400);
	}

	const users = JSON.parse(req.body.users);

	if (users.length === 0) {
		console.log('Users array is empty');
		return res.sendStatus(400);
	}

	users.push(req.session.user);

	let groupChatStatus = true;

	if (users.length === 2) {
		if (users[0]._id === req.session.user._id || users[1]._id === req.session.user._id) {
			groupChatStatus = false;
		}
	}

	const chatData = {
		users: users,
		isGroupChat: groupChatStatus,
	};

	const chat = await Chat.create(chatData);

	if (!chat) {
		console.log('Error creating chat');
		return res.sendStatus(400);
	}

	res.status(200).send(chat);
});

exports.getSingleChat = catchAsync(async (req, res, next) => {
	const chat = await Chat.findOne({
		_id: req.params.chatId,
		users: { $elemMatch: { $eq: req.session.user._id } },
	}).populate('users');

	if (!chat) {
		console.log('Could not find chat');
		res.sendStatus(404);
	}

	res.status(200).send(chat);
});

exports.updateChat = catchAsync(async (req, res, next) => {
	const chat = await Chat.findByIdAndUpdate(req.params.chatId, req.body);

	if (!chat) {
		console.log('Could not update chat');
		res.sendStatus(400);
	}

	res.sendStatus(204);
});

exports.getMessages = catchAsync(async (req, res, next) => {
	const messages = await Message.find({ chat: req.params.chatId }).populate('sender');

	if (!messages) {
		console.log('Could not find messages');
		res.sendStatus(404);
	}

	await messages.forEach(async (message) => {
		if (message.vector) {
			message.content = await messageEncryption.decrypt(message.content, message.vector);
		}
	});

	res.status(200).send(messages);
});

exports.markAsRead = catchAsync(async (req, res, next) => {
	const messages = await Message.updateMany(
		{ chat: req.params.chatId },
		{ $addToSet: { readBy: req.session.user._id } }
	);

	if (!messages) {
		console.log('Could not update messages');
		res.sendStatus(400);
	}

	res.sendStatus(204);
});
