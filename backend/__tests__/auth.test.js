const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nobzo-blog-test');
  await User.deleteMany({});
  await Post.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.name).toBe('John Doe');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Jane',
          email: 'jane@example.com',
          password: 'password456'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should reject registration with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.deleteMany({});
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test User',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
