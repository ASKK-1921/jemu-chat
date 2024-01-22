const crypto = require('crypto');

/**
 * Function to encrypt a message
 * @param {string} messageText The message to be encrypted
 * @returns {object} The encrypted message
 */
exports.encrypt = (messageText) => {
	// Create a random 16-digit intialisation vector
	const vector = crypto.randomBytes(16);
	// Encrypt the messageText uscing encryption algorithm, private key, and vector
	const cipher = crypto.createCipheriv(process.env.ENCRYPTION_ALGORITHM, process.env.ENCRYPTION_PRIVATE_KEY, vector);
	let encryptedMessage = cipher.update(messageText, 'utf-8', 'hex');
	encryptedMessage += cipher.final('hex');
	// Convert the vector to base64 string
	const base64vector = Buffer.from(vector, 'binary').toString('base64');

	const encryptedData = {
		message: encryptedMessage,
		vector: base64vector,
	};

	console.log(typeof encryptedData);
	return encryptedData;
};

/**
 * Function to decrypt a message
 * @param {string} messageText The message to be decrypted
 * @param {string} vector The associated 16-digit initilisation vector
 * @returns {object} The decrypted message
 */
exports.decrypt = (messageText, vector) => {
	// Convert initialize vector from base64 to buffer
	const originalData = Buffer.from(vector, 'base64');

	const decipher = crypto.createDecipheriv(
		process.env.ENCRYPTION_ALGORITHM,
		process.env.ENCRYPTION_PRIVATE_KEY,
		originalData
	);

	let decryptedData = decipher.update(messageText, 'hex', 'utf-8');
	decryptedData += decipher.final('utf8');

	return decryptedData;
};
