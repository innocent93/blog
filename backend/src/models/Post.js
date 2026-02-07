const mongoose = require('mongoose');
const { generateSlug } = require('../utils/slugify');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: null }
});

postSchema.pre('validate', async function (next) {
  if (!this.slug && this.title) {
    this.slug = await generateSlug(this.constructor, this.title);
  }
  next();
});

postSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Post', postSchema);
