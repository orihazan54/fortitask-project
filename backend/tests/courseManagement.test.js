
// Comprehensive course management testing suite for academic assignment system
// Tests course creation, access control, file uploads, and teacher-student interactions

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// In-memory database for isolated testing
let mongo;

// Mock Cloudinary file upload service for testing without external dependencies
jest.mock('../config/cloudinary', () => {
  const multer = require('multer');
  const memoryUpload = multer({ storage: multer.memoryStorage() });

  return {
    upload: {
      single: (field) => (req, res, next) => {
        memoryUpload.single(field)(req, res, (err) => {
          if (err) return next(err);
          if (req.file && !req.file.path) {
            req.file.path = `http://mock.cloudinary/${req.file.originalname}`;
          }
          next();
        });
      }
    },
    cloudinary: { 
      v2: { 
        uploader: {
          destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
      } 
    }
  };
});

process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

const app = require('../server');
const Course = require('../models/Course');
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
  await Course.deleteMany({});
});

// Helper function for generating authentication tokens with role-based permissions
const generateToken = (userId, role = 'Teacher') => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Complete course management workflow testing for academic integrity
describe('Course Management Tests', () => {
  // Course creation testing with authorization and data validation
  describe('POST /api/courses/create', () => {
    // Test successful course creation by authorized teacher
    it('should create a course successfully by teacher', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const token = generateToken(teacher._id, 'Teacher');
      
      const courseData = {
        courseName: 'Advanced Mathematics',
        creditPoints: '4',
        instructions: 'Complete all assignments on time',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/courses/create')
        .set('Authorization', `Bearer ${token}`)
        .send(courseData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Course created successfully!');
      expect(res.body.course.name).toBe(courseData.courseName);
      expect(res.body.course.creditPoints).toBe(4);
      expect(res.body.course.teacherId).toBe(teacher._id.toString());
    });

    it('should reject course creation by student', async () => {
      const student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const token = generateToken(student._id, 'Student');
      
      const courseData = {
        courseName: 'Unauthorized Course',
        creditPoints: '3',
        instructions: 'This should fail',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/courses/create')
        .set('Authorization', `Bearer ${token}`)
        .send(courseData);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only teachers can create courses');
    });

    it('should reject course creation without authentication', async () => {
      const courseData = {
        courseName: 'No Auth Course',
        creditPoints: '3',
        instructions: 'This should fail',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/courses/create')
        .send(courseData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Access denied');
    });

    it('should reject course creation with missing required fields', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const token = generateToken(teacher._id, 'Teacher');
      
      const courseData = {
        courseName: 'Incomplete Course',
        // missing creditPoints, instructions, deadline
      };

      const res = await request(app)
        .post('/api/courses/create')
        .set('Authorization', `Bearer ${token}`)
        .send(courseData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('All course details are required.');
    });
  });

  describe('GET /api/courses', () => {
    it('should fetch teacher courses for teacher', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const course = await Course.create({
        name: 'Test Course',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id
      });

      const token = generateToken(teacher._id, 'Teacher');

      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Test Course');
      expect(res.body[0].teacherName).toBe('TestTeacher');
    });

    it('should fetch all courses for student', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      await Course.create({
        name: 'Available Course',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id
      });

      const token = generateToken(student._id, 'Student');

      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Available Course');
    });
  });

  describe('POST /api/courses/register/:id', () => {
    it('should allow student to register for course', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const course = await Course.create({
        name: 'Registration Course',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id
      });

      const token = generateToken(student._id, 'Student');

      const res = await request(app)
        .post(`/api/courses/register/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully registered to the course.');
    });

    it('should prevent duplicate registration', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const course = await Course.create({
        name: 'Duplicate Registration Course',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id,
        students: [student._id]
      });

      const token = generateToken(student._id, 'Student');

      const res = await request(app)
        .post(`/api/courses/register/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You are already registered for this course.');
    });

    it('should reject teacher registration for course', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const course = await Course.create({
        name: 'Teacher Registration Course',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id
      });

      const token = generateToken(teacher._id, 'Teacher');

      const res = await request(app)
        .post(`/api/courses/register/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only students can register');
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should allow teacher to delete their own course', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const course = await Course.create({
        name: 'Course to Delete',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id
      });

      const token = generateToken(teacher._id, 'Teacher');

      const res = await request(app)
        .delete(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Course deleted successfully.');
    });

    it('should reject student trying to delete course', async () => {
      const teacher = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: 'hashedpass',
        role: 'Teacher'
      });

      const student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: 'hashedpass',
        role: 'Student'
      });

      const course = await Course.create({
        name: 'Protected Course',
        creditPoints: 3,
        instructions: 'Test instructions',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teacherId: teacher._id
      });

      const token = generateToken(student._id, 'Student');

      const res = await request(app)
        .delete(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only teachers can delete courses');
    });
  });
});