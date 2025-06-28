
// Comprehensive middleware testing suite for authentication, authorization, and security validation
// Tests JWT token handling, role-based access control, CORS configuration, and error handling

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// In-memory MongoDB instance for isolated testing
let mongo;

// Test environment configuration with secure defaults
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

const app = require('../server');
const User = require('../models/User');

// Test database setup with in-memory MongoDB for complete isolation
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Clean database shutdown to prevent memory leaks
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

// Reset database state for consistent test execution
beforeEach(async () => {
  await User.deleteMany({});
});

// Comprehensive middleware validation covering authentication, authorization, and security layers
describe('Authentication Middleware Tests', () => {
  // JWT token validation testing for secure access control
  describe('Token Validation', () => {
    // Test missing authentication header rejection
    it('should reject requests without Authorization header', async () => {
      const res = await request(app)
        .get('/api/courses');

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Access denied. No token provided.');
    });

    // Test malformed authorization header handling
    it('should reject requests with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', 'InvalidFormat');

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Access denied. Invalid token format.');
    });

    // Test invalid JWT token rejection for security
    it('should reject requests with invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Invalid or expired token.');
    });

    // Test expired token security enforcement
    it('should reject requests with expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user123', role: 'Student' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Invalid or expired token.');
    });

    // Test valid JWT token acceptance with proper user context
    it('should accept requests with valid JWT token', async () => {
      // Create authenticated test user for realistic token validation
      const user = await User.create({
        username: 'TestUser',
        email: 'test@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const validToken = jwt.sign(
        { id: user._id.toString(), role: 'Student' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${validToken}`);

      // Verify authentication success (non-auth error codes)
      expect(res.statusCode).not.toBe(401);
      expect(res.statusCode).not.toBe(403);
    });

    it('should handle JWT with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { id: 'user123', role: 'Student' },
        'wrongsecret',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Invalid or expired token.');
    });
  });

  // Role-based access control testing for academic system security
  describe('Role-based Access Control', () => {
    // Test teacher authorization for course creation privileges
    it('should allow teacher to access teacher-only endpoints', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const teacherToken = jwt.sign(
        { id: teacher._id.toString(), role: 'Teacher' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const courseData = {
        courseName: 'Test Course',
        creditPoints: '3',
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/courses/create')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(courseData);

      expect(res.statusCode).toBe(201);
    });

    // Test student access restriction to teacher-only functionality
    it('should prevent student from accessing teacher-only endpoints', async () => {
      const student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const studentToken = jwt.sign(
        { id: student._id.toString(), role: 'Student' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const courseData = {
        courseName: 'Unauthorized Course',
        creditPoints: '3',
        instructions: 'This should fail',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/courses/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(courseData);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only teachers');
    });
  });

  // Cross-Origin Resource Sharing (CORS) and security header validation
  describe('CORS and Security Headers', () => {
    // Test CORS header inclusion for cross-domain communication
    it('should include CORS headers in response', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    // Test preflight request handling for complex CORS scenarios
    it('should handle preflight OPTIONS requests', async () => {
      const res = await request(app)
        .options('/api/courses')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      // Verify proper preflight response codes
      expect([200, 204]).toContain(res.statusCode);
    });
  });

  // Error handling middleware validation for robust system behavior
  describe('Error Handling Middleware', () => {
    // Test malformed request body handling for security
    it('should handle malformed JSON in request body', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}');

      expect(res.statusCode).toBe(400);
    });

    it('should handle invalid MongoDB ObjectId format', async () => {
      const user = await User.create({
        username: 'TestUser',
        email: 'test@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const token = jwt.sign(
        { id: user._id.toString(), role: 'Student' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/courses/invalidobjectid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Failed to fetch course details.');
    });
  });

  describe('Rate Limiting Simulation', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/users/login')
            .send({
              email: 'nonexistent@test.com',
              password: 'wrong'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should be handled without server errors
      responses.forEach(res => {
        expect(res.statusCode).not.toBe(500);
        // Should get 404 for non-existent user
        expect(res.statusCode).toBe(404);
      });
    });
  });
});