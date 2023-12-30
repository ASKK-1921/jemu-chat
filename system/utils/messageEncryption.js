const crypto = require('crypto');

/**
 * Function to return a rendered page
 * @param {request} req The request object
 * @param {response} res The response object
 * @param {number} statusCode The HTML status code
 * @param {string} page String of page name
 * @param {{  }} [payload] Data to be passed to the page (default with user session and title from page string)
 * @returns {render} Renders the page
 */
exports.encrypt = (messageText) => {
	// const messageText = req.body.content;
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

	return encryptedData;
};

/**
 * Function to return a rendered page
 * @param {request} req The request object
 * @param {response} res The response object
 * @param {number} statusCode The HTML status code
 * @param {string} page String of page name
 * @param {{  }} [payload] Data to be passed to the page (default with user session and title from page string)
 * @returns {render} Renders the page
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
