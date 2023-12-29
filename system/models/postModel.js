const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			trim: true,
		},
		postedBy: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
		},
		pinned: {
			type: Boolean,
		},
		likes: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User',
			},
		],
		shareUsers: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User',
			},
		],
		shareData: {
			type: mongoose.Schema.ObjectId,
			ref: 'Post',
		},
		replyTo: {
			type: mongoose.Schema.ObjectId,
			ref: 'Post',
		},
	},
	{
		timestamps: true,
	}
);

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
