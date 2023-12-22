const express = require('express');
const bodyParser = require('body-parser');
const User = require('../../models/userModel');
const Chat = require('../../models/chatModel');
const Message = require('../../models/messageModel');
const Notification = require('../../models/notificationsModel');

const app = express();

const router = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));

router.post('/', async (req, res, next) => {
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
			message = await message.populate(['sender']);
			message = await message.populate(['chat']);
			message = await User.populate(message, { path: 'chat.users' });
			const chat = await Chat.findByIdAndUpdate(req.body.chatId, {
				latestMessage: message,
			}).catch((error) => {
				console.log(error);
			});

			insertNotifications(chat, message);

			res.status(201).send(message);
		})
		.catch((error) => {
			console.log(error);
			res.sendStatus(400);
		});
});

function insertNotifications(chat, message) {
	chat.users.forEach((userId) => {
		if (userId === message.sender._id.toString()) {
			return;
		}
		Notification.insertNotification(userId, message.sender._id, 'newMessage', message.chat._id);
	});
}

module.exports = router;
