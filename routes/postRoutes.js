const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const app = express();

const router = express.Router();

router.get('/:id', (req, res, next) => {
  const payload = {
    pageTitle: 'View Post',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
    postId: req.params.id,
  };
  res.status(200).render('postPage', payload);
});

module.exports = router;
