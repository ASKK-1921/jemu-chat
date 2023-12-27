const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/', notificationController.getNotifications);
router.get('/latest', notificationController.getLatestNotification);
router.put('/:id/opened', notificationController.markAsRead);
router.put('/opened', notificationController.markAllAsRead);

module.exports = router;
