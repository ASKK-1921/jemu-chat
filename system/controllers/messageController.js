const catchAsync = require('../utils/catchAsync');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Notification = require('../models/notificationModel');
const messageEncryption = require('../utils/messageEncryption');

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
		// eslint-disable-next-line no-console
		console.log('Invalid data pass into the request');
		return res.sendStatus(400);
	}

	const encryptedMessageData = await messageEncryption.encrypt(req.body.content);

	const newMessage = {
		sender: req.session.user._id,
		vector: encryptedMessageData.vector,
		content: encryptedMessageData.message,
		chat: req.body.chatId,
		readBy: [req.session.user._id],
	};

	const createdMessage = await Message.create(newMessage).then(async (message) => {
		message = await message.populate(['sender']);
		message = await message.populate(['chat']);
		message = await User.populate(message, { path: 'chat.users' });
		return message;
	});

	if (!createdMessage) {
		// eslint-disable-next-line no-console
		console.log('Could not create message');
		res.sendStatus(400);
	}

	const chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: createdMessage }, { new: true });
	insertNotification(chat, createdMessage);

	const decryptedMessageData = await messageEncryption.decrypt(createdMessage.content, createdMessage.vector);

	createdMessage.content = decryptedMessageData;

	res.status(201).send(createdMessage);
});
