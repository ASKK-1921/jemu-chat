// const UAParser = require('ua-parser-js');
// const languageManager = require('./languageManager');

/**
 * Check to see if the current device is mobile or not
 * @param {request} req The Express request
 * @returns {boolean} true if the device is mobile, false otherwise
 */
// const checkDevice = (req) => {
// 	const parser = new UAParser();
// 	const ua = req.headers['user-agent'];
// 	return parser.setUA(ua).getDevice().type === 'mobile';
// };

/**
 * Function to return a rendered page
 * @param {request} req The request object
 * @param {response} res The response object
 * @param {number} statusCode The HTML status code
 * @param {string} page String of page name
 * @param {{  }} [payload] Data to be passed to the page (default with user session and title from page string)
 * @returns {render} Renders the page
 */
module.exports = (req, res, statusCode, page, payload = {}) => {
	// const device = checkDevice(req) ? 'mobile/' : 'desktop/';
	// const lang = languageManager(req, res);
	payload.pageTitle = payload.pageTitle || page.charAt(0).toUpperCase() + page.slice(1);

	if (req.session.user) {
		payload.userLoggedIn = req.session.user;
		payload.userLoggedInJs = JSON.stringify(req.session.user);
	}

	// return res.status(200).render(`${device}/${page}.ejs`, { title, lang });
	return res.status(statusCode).render(`${page}`, payload);
};
