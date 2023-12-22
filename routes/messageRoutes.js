const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const app = express();

const router = express.Router();

router.get('/', (req, res, next) => {
  const payload = {
    pageTitle: 'Inbox',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render('inboxPage', payload);
});

router.get('/new', (req, res, next) => {
  const payload = {
    pageTitle: 'New Message',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render('newMessagePage', payload);
});

router.get('/:chatId', async (req, res, next) => {
  const userId = req.session.user._id;
  const chatId = req.params.chatId;
  const isValidId = mongoose.isValidObjectId(chatId);

  let payload = {
    pageTitle: 'Chat',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };

  if (!isValidId) {
    console.log('Over here');
    payload.errorMessage =
      'Chat does not exist or you do not have permission to view it';
    return res.status(200).render('chatPage', payload);
  }

  let chat = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: userId } },
  }).populate('users');

  if (chat == null) {
    const userFound = await User.findById(chatId);
    if (userFound != null) {
      chat = await getChatByUserId(userFound._id, userId);
    }
  }

  if (chat == null) {
    payload.errorMessage =
      'Chat does not exist or you do not have permission to view it';
  } else {
    payload.chat = chat;
  }

  res.status(200).render('chatPage', payload);
});

function getChatByUserId(userLoggedInId, otherUserId) {
  return Chat.findOneAndUpdate(
    {
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [
          { $elemMatch: { $eq: new mongoose.Types.ObjectId(userLoggedInId) } },
          { $elemMatch: { $eq: new mongoose.Types.ObjectId(otherUserId) } },
        ],
      },
    },
    { $setOnInsert: { users: [userLoggedInId, otherUserId] } },
    {
      new: true,
      upsert: true,
    }
  ).populate('users');
}

module.exports = router;
