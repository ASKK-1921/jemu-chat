const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getUsers);
router.put('/:userId/follow', userController.followUser);
router.get('/:userId/following', userController.getFollowing);
router.get('/:userId/followers', userController.getFollowers);
router.post('/profilePicture', userController.uploadFile, userController.updateImageData);
router.post('/coverPhoto', userController.uploadFile, userController.updateImageData);

module.exports = router;
