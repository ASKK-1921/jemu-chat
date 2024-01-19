const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/register').get(viewController.getRegisterPage).post(authController.register);
router.route('/login').get(viewController.getLoginPage).post(authController.login);
router.get('/logout', authController.logout);

// router.use(authController.requireLogin);
router.get('/', viewController.getHomePage);
router.get('/profile', viewController.getProfilePage);
router.get('/profile/:username', viewController.getUserProfilePage);
router.get('/profile/:username/:dataType', viewController.getProfileDetailsPage);
router.get('/notifications', viewController.getNotificationsPage);
router.get('/chat', viewController.getInboxPage);
router.get('/groups', viewController.getInboxPage);
router.get('/messages/new', viewController.getNewChatPage);
router.get('/messages/:chatId', viewController.getSingleChatPage);
router.get('/search', viewController.getSearchPage);
router.get('/search/:selectedTab', viewController.getSearchTabPage);

router.get('/post/:id', viewController.getSinglePostPage);

module.exports = router;
