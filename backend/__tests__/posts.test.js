const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const config = require('../src/config');

let authToken = '';
let authorUserId = '';
let anotherUserToken = '';
let anotherUserId = '';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nobzo-blog-test');
  await User.deleteMany({});
  await Post.deleteMany({});

  // Create first user for auth tests
  const user1 = new User({
    name: 'Author User',
    email: 'author@example.com',
    password: 'password123'
  });
  await user1.save();
  authorUserId = user1._id.toString();
  authToken = jwt.sign({ id: user1._id }, config.JWT_SECRET, { expiresIn: '7d' });

  // Create second user for authorization tests
  const user2 = new User({
    name: 'Another User',
    email: 'another@example.com',
    password: 'password456'
  });
  await user2.save();
  anotherUserId = user2._id.toString();
  anotherUserToken = jwt.sign({ id: user2._id }, config.JWT_SECRET, { expiresIn: '7d' });
});

afterAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await mongoose.connection.close();
});

describe('Post Endpoints', () => {
  describe('POST /api/posts', () => {
    it('should create a post when authenticated', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'Test content',
          tags: ['test', 'post'],
          status: 'draft'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe('Test Post');
      expect(res.body.slug).toBe('test-post');
      expect(res.body.author.toString()).toBe(authorUserId);
      expect(res.body.status).toBe('draft');
    });

    it('should reject post creation without auth', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'Should fail'
        });

      expect(res.status).toBe(401);
    });

    it('should reject post creation with missing title', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Missing title'
        });

      expect(res.status).toBe(400);
    });

    it('should generate unique slug for duplicate titles', async () => {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Duplicate Title',
          content: 'First post'
        });

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Duplicate Title',
          content: 'Second post'
        });

      expect(res.status).toBe(201);
      expect(res.body.slug).toMatch(/duplicate-title-\d+/);
    });
  });

  describe('GET /api/posts', () => {
    let publishedPostId = '';
    let draftPostId = '';

    beforeAll(async () => {
      // Create published post
      const publishedPost = new Post({
        title: 'Published Post',
        slug: 'published-post',
        content: 'Published content',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'published',
        tags: ['published']
      });
      await publishedPost.save();
      publishedPostId = publishedPost._id.toString();

      // Create draft post
      const draftPost = new Post({
        title: 'Draft Post',
        slug: 'draft-post',
        content: 'Draft content',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'draft',
        tags: ['draft']
      });
      await draftPost.save();
      draftPostId = draftPost._id.toString();
    });

    it('should list published posts for unauthenticated users', async () => {
      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.some(p => p._id === publishedPostId)).toBe(true);
      expect(res.body.items.some(p => p._id === draftPostId)).toBe(false);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('total');
    });

    it('should filter by search term', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ search: 'Published' });

      expect(res.status).toBe(200);
      expect(res.body.items.some(p => p.title.includes('Published'))).toBe(true);
    });

    it('should filter by tag', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ tag: 'published' });

      expect(res.status).toBe(200);
      expect(res.body.items.every(p => p.tags.includes('published'))).toBe(true);
    });

    it('should show draft posts only to authenticated author', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'draft' });

      expect(res.status).toBe(200);
      expect(res.body.items.some(p => p._id === draftPostId)).toBe(true);
    });

    it('should reject draft filter without auth', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ status: 'draft' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts/:slug', () => {
    let publishedPostSlug = '';

    beforeAll(async () => {
      const post = new Post({
        title: 'Get By Slug Test',
        slug: 'get-by-slug-test',
        content: 'Test content',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'published'
      });
      await post.save();
      publishedPostSlug = post.slug;
    });

    it('should get published post by slug', async () => {
      const res = await request(app).get(`/api/posts/${publishedPostSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe(publishedPostSlug);
      expect(res.body.title).toBe('Get By Slug Test');
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/posts/nonexistent-slug');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Not found');
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postIdToUpdate = '';

    beforeAll(async () => {
      const post = new Post({
        title: 'Post to Update',
        slug: 'post-to-update',
        content: 'Original content',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'draft'
      });
      await post.save();
      postIdToUpdate = post._id.toString();
    });

    it('should update post when authenticated as author', async () => {
      const res = await request(app)
        .put(`/api/posts/${postIdToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
          status: 'published'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.content).toBe('Updated content');
      expect(res.body.status).toBe('published');
    });

    it('should reject update without auth', async () => {
      const res = await request(app)
        .put(`/api/posts/${postIdToUpdate}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(401);
    });

    it('should reject update by non-author', async () => {
      const res = await request(app)
        .put(`/api/posts/${postIdToUpdate}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should reject update with invalid post id', async () => {
      const res = await request(app)
        .put('/api/posts/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postIdToDelete = '';

    beforeAll(async () => {
      const post = new Post({
        title: 'Post to Delete',
        slug: 'post-to-delete',
        content: 'To be deleted',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'draft'
      });
      await post.save();
      postIdToDelete = post._id.toString();
    });

    it('should soft delete post when authenticated as author', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);

      // Verify soft delete
      const post = await Post.findById(postIdToDelete);
      expect(post.deletedAt).toBeDefined();
      expect(post.deletedAt).not.toBeNull();
    });

    it('should reject delete without auth', async () => {
      const newPost = new Post({
        title: 'Another Post',
        slug: 'another-post-delete',
        content: 'To delete',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'draft'
      });
      await newPost.save();

      const res = await request(app).delete(`/api/posts/${newPost._id}`);

      expect(res.status).toBe(401);
    });

    it('should reject delete by non-author', async () => {
      const newPost = new Post({
        title: 'Non-Author Delete',
        slug: 'non-author-delete',
        content: 'To delete',
        author: new mongoose.Types.ObjectId(authorUserId),
        status: 'draft'
      });
      await newPost.save();

      const res = await request(app)
        .delete(`/api/posts/${newPost._id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});
