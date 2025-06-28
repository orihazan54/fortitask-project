
// Comprehensive user authentication testing suite for academic assignment management system
// Tests user registration, login validation, password security, and JWT token generation

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory database instance for isolated testing
let mongo;

// Test environment configuration with secure authentication settings
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

const app = require('../server');
const User = require('../models/User');

// Initialize isolated test database environment
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Clean shutdown and resource cleanup
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

// Reset user collection for consistent test execution
beforeEach(async () => {
  await User.deleteMany({});
});

// Complete user authentication workflow testing for academic system security
describe('User Authentication Tests', () => {
  // User registration testing with role-based access control
  describe('POST /api/users/signup', () => {
    // Test successful student registration with 2FA setup
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

    // Test successful teacher registration with admin privileges
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

    // Test duplicate email prevention for data integrity
    it('should reject registration with existing email', async () => {
      const userData = {
        username: 'testUser',
        email: 'duplicate@test.com',
        password: 'TestPassword123!',
        role: 'Student'
      };

      // Create initial user account
      await request(app)
        .post('/api/users/signup')
        .send(userData);

      // Verify duplicate email rejection
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

  // User login authentication and session management testing
  describe('POST /api/users/login', () => {
    // Setup authenticated test user for login validation
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      await User.create({
        username: 'loginTestUser',
        email: 'login@test.com',
        password: hashedPassword,
        role: 'Student'
      });
    });

    // Test successful login with JWT token generation
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