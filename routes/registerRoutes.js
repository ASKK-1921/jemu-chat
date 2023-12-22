const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const router = express.Router();

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

router
  .route('/')
  .get((req, res, next) => {
    res.status(200).render('register');
  })
  .post(async (req, res, next) => {
    const firstName = req.body.firstName.trim();
    const lastName = req.body.lastName.trim();
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const password = req.body.password;

    const payload = { firstName, lastName, username, email };

    if (firstName && lastName && username && email && password) {
      const user = await User.findOne({
        $or: [{ username: username }, { email: email }],
      }).catch((err) => {
        console.log(err);
        payload.errorMessage = 'Something went wrong';
        res.status(200).render('register', payload);
      });

      if (user == null) {
        // No user found
        const data = req.body;
        data.password = await bcrypt.hash(password, 10);
        User.create(data).then((user) => {
          req.session.user = user;
          return res.redirect('/');
        });
      } else {
        // User found
        if (email == user.email) {
          payload.errorMessage = 'Email already in use';
        } else {
          payload.errorMessage = 'Username already in use';
        }
        res.status(200).render('register', payload);
      }
    } else {
      payload.errorMessage = 'Make sure each field has a valid value';
      res.status(200).render('register', payload);
    }
  });

router.get('/', (req, res, next) => {
  res.status(200).render('register');
});

module.exports = router;
