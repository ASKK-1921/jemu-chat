const express = require('express');
const postController = require('../controllers/postController');

const router = express.Router();

router.route('/').get(postController.getFilteredPosts).post(postController.createPost);
router
	.route('/:id')
	.get(postController.getSinglePost)
	.put(postController.updatePinnedPost)
	.delete(postController.deletePost);
router.put('/:postId/like', postController.toggleLikeForPost);
router.post('/:postId/share', postController.toggleShareForPost);

module.exports = router;
