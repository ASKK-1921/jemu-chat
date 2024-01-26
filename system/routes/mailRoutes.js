const express = require('express');
const sendGrid = require('../utils/sendGrid');

const router = express.Router();

router.get('/', (req, res, next) => {
	sendGrid.sendEmail();
	return res.sendStatus(200);
});

module.exports = router;
