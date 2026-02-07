const mongoose = require('mongoose');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function createPost(req, res, next) {
  try {
    const { title, content, tags, status } = req.body;
    const post = new Post({ title, content, tags: tags || [], status: status || 'draft', author: req.user._id });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

async function listPosts(req, res, next) {
  try {
    const { page = 1, limit = 10, search, tag, author, status } = req.query;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const q = { deletedAt: null };

    let requesterId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(' ')[1], config.JWT_SECRET);
        requesterId = payload.id;
      } catch (e) {
        requesterId = null;
      }
    }

    if (status) {
      if (status === 'draft') {
        if (!requesterId) return res.status(401).json({ message: 'Authentication required for draft filter' });
        q.status = 'draft';
        q.author = mongoose.Types.ObjectId(requesterId);
      } else if (status === 'published') {
        q.status = 'published';
      }
    } else {
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
  } catch (err) {
    next(err);
  }
}

async function getPostBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug, status: 'published', deletedAt: null }).populate('author', 'name email');
    if (!post) return res.status(404).json({ message: 'Not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    const post = await Post.findById(id);
    if (!post || post.deletedAt) return res.status(404).json({ message: 'Not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    post.deletedAt = new Date();
    await post.save();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, listPosts, getPostBySlug, updatePost, deletePost };
