const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		profilePicture: {
			type: String,
			default: '/images/profilePicture.png',
		},
		coverPhoto: {
			type: String,
		},
		likes: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Post',
			},
		],
		retweets: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Post',
			},
		],
		following: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User',
			},
		],
		followers: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
