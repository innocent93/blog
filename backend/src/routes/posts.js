const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Create post (auth required)
router.post('/', auth, [
  body('title').isString().notEmpty(),
  body('content').isString().notEmpty(),
  body('tags').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, content, tags, status } = req.body;
  const post = new Post({ title, content, tags: tags || [], status: status || 'draft', author: req.user._id });
  await post.save();
  res.status(201).json(post);
});

// GET /api/posts — public (published only) with filters and pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, search, tag, author, status } = req.query;
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const q = { deletedAt: null };

  // Only include drafts when authenticated and author is the requester
  let requesterId = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      // lazy require to avoid circular on startup
      const jwt = require('jsonwebtoken');
      const config = require('../config');
      const payload = jwt.verify(req.headers.authorization.split(' ')[1], config.JWT_SECRET);
      requesterId = payload.id;
    } catch (e) {
      requesterId = null;
    }
  }

  if (status) {
    // authenticated users may filter by status, but drafts only visible to their author
    if (status === 'draft') {
      if (!requesterId) return res.status(401).json({ message: 'Authentication required for draft filter' });
      q.status = 'draft';
      q.author = mongoose.Types.ObjectId(requesterId);
    } else if (status === 'published') {
      q.status = 'published';
    }
  } else {
    // default: only published for public
    q.status = 'published';
  }

  if (search) {
    q.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  if (tag) q.tags = tag;
  if (author) {
    if (mongoose.isValidObjectId(author)) q.author = author;
  }

  const total = await Post.countDocuments(q);
  const items = await Post.find(q)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.max(1, parseInt(limit, 10)))
    .populate('author', 'name email');

  res.json({ page: parseInt(page, 10), limit: parseInt(limit, 10), total, items });
});

// Get single published post by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug, status: 'published', deletedAt: null }).populate('author', 'name email');
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});

// Update post (author only)
router.put('/:id', auth, [
  body('title').optional().isString().notEmpty(),
  body('content').optional().isString().notEmpty(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['draft', 'published'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const post = await Post.findById(id);
  if (!post || post.deletedAt) return res.status(404).json({ message: 'Not found' });
  if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  const { title, content, tags, status } = req.body;
  if (title) post.title = title;
  if (content) post.content = content;
  if (tags) post.tags = tags;
  if (status) post.status = status;
  await post.save();
  res.json(post);
});

// Soft delete (author only)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const post = await Post.findById(id);
  if (!post || post.deletedAt) return res.status(404).json({ message: 'Not found' });
  if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  post.deletedAt = new Date();
  await post.save();
  res.status(204).send();
});

module.exports = router;
