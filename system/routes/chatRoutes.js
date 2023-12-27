const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.route('/').get(chatController.getAllChats).post(chatController.createChat);
router.route('/:chatId').get(chatController.getSingleChat).put(chatController.updateChat);
router.get('/:chatId/messages', chatController.getMessages);
router.put('/:chatId/messages/markAsRead', chatController.markAsRead);

module.exports = router;
