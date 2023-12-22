const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const app = express();

const router = express.Router();

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res, next) => {
	res.status(200).render('login');
});

router.post('/', async (req, res, next) => {
	const { logUsername } = req.body;
	const payload = { logUsername };
	if (req.body.logUsername && req.body.logPassword) {
		const user = await User.findOne({
			$or: [{ username: logUsername }, { email: logUsername }],
		}).catch((err) => {
			console.log(err);
			payload.errorMessage = 'Something went wrong';
			res.status(200).render('login', payload);
		});

		if (user !== null) {
			const result = await bcrypt.compare(req.body.logPassword, user.password);
			if (result === true) {
				req.session.user = user;
				return res.redirect('/');
			}
		}
		payload.errorMessage = 'Login credentials incorrect';
		return res.status(200).render('login', payload);
	}
	payload.errorMessage = 'Make sure each field has a valid value';
	res.status(200).render('login', payload);
});

module.exports = router;
