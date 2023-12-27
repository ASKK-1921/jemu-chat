const catchAsync = require('../utils/catchAsync');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Notification = require('../models/notificationModel');

const insertNotification = (chat, message) => {
	chat.users.forEach((userId) => {
		if (userId === message.sender._id.toString()) {
			return;
		}
		Notification.insertNotification(userId, message.sender._id, 'newMessage', message.chat._id);
	});
};

exports.createMessage = catchAsync(async (req, res, next) => {
	if (!req.body.content || !req.body.chatId) {
		console.log('Invalid data pass into the request');
		return res.sendStatus(400);
	}

	const newMessage = {
		sender: req.session.user._id,
		content: req.body.content,
		chat: req.body.chatId,
		readBy: [req.session.user._id],
	};

	Message.create(newMessage)
		.then(async (message) => {
			const chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message }, { new: true });
			message = await message.populate(['sender']);
			message = await message.populate(['chat']);
			message = await User.populate(message, { path: 'chat.users' });

			// Patch for bug in brand new chats
			console.log(chat);
			console.log(message);

			insertNotification(chat, message);

			res.status(201).send(message);
		})
		.catch((error) => {
			console.log(error);
			res.sendStatus(400);
		});
});
