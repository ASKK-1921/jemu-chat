const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res, next) => {
	const searchObj = {
		userTo: req.session.user._id,
		notificationType: { $ne: 'newMessage' },
	};

	if (req.query.unreadOnly !== undefined && req.query.unreadOnly === 'true') {
		searchObj.opened = false;
	}

	const notification = await Notification.find(searchObj)
		.populate('userTo')
		.populate('userFrom')
		.sort({ createdAt: -1 });

	if (!notification) {
		// eslint-disable-next-line no-console
		console.log('Unable to load notification');
		res.sendStatus(400);
	}

	res.status(200).send(notification);
});

exports.getLatestNotification = catchAsync(async (req, res, next) => {
	const notification = await Notification.findOne({ userTo: req.session.user._id })
		.populate('userTo')
		.populate('userFrom')
		.sort({ createdAt: -1 });

	if (!notification) {
		// eslint-disable-next-line no-console
		console.log('Unable to load notification');
		res.sendStatus(400);
	}

	res.status(200).send(notification);
});

exports.markAsRead = catchAsync(async (req, res, next) => {
	const notification = await Notification.findByIdAndUpdate(req.params.id, { opened: true });

	if (!notification) {
		// eslint-disable-next-line no-console
		console.log('Unable to update notification');
		res.sendStatus(400);
	}

	res.sendStatus(204);
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
	const notifications = await Notification.updateMany(
		{
			userTo: req.session.user._id,
		},
		{ opened: true }
	);

	if (!notifications) {
		// eslint-disable-next-line no-console
		console.log('Unable to update notifications');
		res.sendStatus(400);
	}

	res.sendStatus(204);
});
