const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');

const router = express.Router();

// Create post (auth required)
router.post('/', auth, [
  body('title').isString().notEmpty(),
  body('content').isString().notEmpty(),
  body('tags').optional().isArray()
], postController.createPost);

// GET /api/posts — public (published only) with filters and pagination
router.get('/', postController.listPosts);

// Get single published post by slug
router.get('/:slug', postController.getPostBySlug);

// Update post (author only)
router.put('/:id', auth, [
  body('title').optional().isString().notEmpty(),
  body('content').optional().isString().notEmpty(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['draft', 'published'])
], postController.updatePost);

// Soft delete (author only)
router.delete('/:id', auth, postController.deletePost);

module.exports = router;
