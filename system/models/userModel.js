const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: [true, 'Users must register a first name'],
			trim: true,
		},
		lastName: {
			type: String,
			required: [true, 'Users must register a last name'],
			trim: true,
		},
		username: {
			type: String,
			required: [true, 'Users must register a unique username'],
			trim: true,
			unique: true,
		},
		email: {
			type: String,
			required: [true, 'Users must register a unique email'],
			trim: true,
			unique: true,
			lowercase: true,
			validate: [validator.isEmail, 'Please enter a valid email address'],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minLength: 8,
			select: false,
		},
		confirmPassword: {
			type: String,
			required: [true, 'Password confirm is required'],
			validate: {
				// This only works on save!
				validator: function (val) {
					return val === this.password; //If passwords match, validation passed
				},
				message: 'Passwords do not match',
			},
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
		loginHistory: [
			{
				loginTimestamp: {
					type: Date,
				},
				loginFrom: {
					type: String,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

// MIDDLEWARE

// Encrypt password when creating/updating
userSchema.pre('save', async function (next) {
	// Skip this process if the password was not modified
	if (!this.isModified('password')) return next();

	// Encrypt password (hasshed with a cost of 12)
	this.password = await bcrypt.hash(this.password, 12);

	// Delete the passwordConfirm field
	this.confirmPassword = undefined;
	next();
});

// METHODS
userSchema.methods.correctPassword = async function (enteredPassword, userPassword) {
	return await bcrypt.compare(enteredPassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
