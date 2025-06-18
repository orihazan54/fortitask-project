
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let mongo;

// Set test environment variables
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

const app = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Authentication Tests', () => {
  describe('POST /api/users/signup', () => {
    it('should register a new student successfully', async () => {
      const userData = {
        username: 'testStudent',
        email: 'student@test.com',
        password: 'TestPassword123!',
        role: 'Student'
      };

      const res = await request(app)
        .post('/api/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User registered successfully! You can now login.');
      expect(res.body.twoFactorQR).toBeDefined();
    });

    it('should register a new teacher successfully', async () => {
      const userData = {
        username: 'testTeacher',
        email: 'teacher@test.com',
        password: 'TeacherPass123!',
        role: 'Teacher'
      };

      const res = await request(app)
        .post('/api/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User registered successfully! You can now login.');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        username: 'testUser',
        email: 'duplicate@test.com',
        password: 'TestPassword123!',
        role: 'Student'
      };

      // First registration
      await request(app)
        .post('/api/users/signup')
        .send(userData);

      // Attempt duplicate registration
      const res = await request(app)
        .post('/api/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('User with this email already exists.');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'testUser',
        email: 'weak@test.com',
        password: '123',
        role: 'Student'
      };

      const res = await request(app)
        .post('/api/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Password must be at least 8 characters and include uppercase, lowercase, number and special character.');
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        username: 'testUser',
        email: 'invalidemail',
        password: 'TestPassword123!',
        role: 'Student'
      };

      const res = await request(app)
        .post('/api/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(400);
    });

    it('should reject registration with missing required fields', async () => {
      const userData = {
        username: 'testUser',
        // missing email and password
        role: 'Student'
      };

      const res = await request(app)
        .post('/api/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('All fields are required.');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      await User.create({
        username: 'loginTestUser',
        email: 'login@test.com',
        password: hashedPassword,
        role: 'Student'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'TestPassword123!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('Student');
      expect(res.body.username).toBe('loginTestUser');
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'WrongPassword123!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'TestPassword123!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found.');
    });

    it('should reject login with missing email', async () => {
      const loginData = {
        password: 'TestPassword123!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(404);
    });

    it('should reject login with missing password', async () => {
      const loginData = {
        email: 'login@test.com'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate valid JWT token', () => {
      const payload = { id: 'user123', role: 'Student' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject expired JWT token', () => {
      const payload = { id: 'user123', role: 'Student' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
      
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });

    it('should reject tampered JWT token', () => {
      const payload = { id: 'user123', role: 'Student' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      
      expect(() => {
        jwt.verify(tamperedToken, process.env.JWT_SECRET);
      }).toThrow();
    });
  });
});