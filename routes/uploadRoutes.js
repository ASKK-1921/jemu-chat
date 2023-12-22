const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('../models/userModel');
const app = express();

const router = express.Router();

router.get('/images/:path', (req, res, next) => {
  res.sendFile(path.join(__dirname, `../uploads/images/${req.params.path}`));
});

module.exports = router;
