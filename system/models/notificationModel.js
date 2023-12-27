const mongoose = require('mongoose');

const NotificationsSchema = new mongoose.Schema(
	{
		userTo: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
		},
		userFrom: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
		},
		notificationType: {
			type: String,
		},
		opened: {
			type: Boolean,
			default: false,
		},
		entityId: {
			type: mongoose.Schema.ObjectId,
		},
	},
	{
		timestamps: true,
	}
);

const Notification = mongoose.model('Notification', NotificationsSchema);

Notification.insertNotification = async (userTo, userFrom, notificationType, entityId) => {
	const data = {
		userTo: userTo,
		userFrom: userFrom,
		notificationType: notificationType,
		entityId: entityId,
	};

	await Notification.deleteOne(data).catch((error) => {
		console.log(error);
	});
	return Notification.create(data).catch((error) => {
		console.log(error);
	});
};

module.exports = Notification;
