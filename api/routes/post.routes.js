const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const postController = require('../controllers/post.controller');

// Apply verifyToken middleware to protected routes
router.post('/', verifyToken, postController.addPost);
router.put('/:id', verifyToken, postController.updatePost);
router.delete('/:id', verifyToken, postController.deletePost);

// Public routes don't need the middleware
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);

module.exports = router;