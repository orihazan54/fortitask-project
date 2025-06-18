
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongo;
let mockUserId;

// Mock config/cloudinary so שה-upload.single('file') יפעל בזיכרון ויוסיף path
jest.mock('../config/cloudinary', () => {
  const multer = require('multer');
  const memoryUpload = multer({ storage: multer.memoryStorage() });

  return {
    upload: {
      single: (field) => (req, res, next) => {
        memoryUpload.single(field)(req, res, (err) => {
          if (err) return next(err);
          if (req.file && !req.file.path) {
            // הוסף URL מדומה כדי שה-route לא יזרוק 400
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
        }, 
        api: {
          ping: jest.fn().mockResolvedValue({ status: 'ok' })
        }
      } 
    },
    testCloudinaryConnection: jest.fn()
  };
});

// Mock axios to avoid external HTTP calls (TSA download etc.)
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: Buffer.from('') }),
  post: jest.fn().mockResolvedValue({ data: {} })
}));

// Set test JWT secret before requiring app
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

const app = require('../server');
const Course = require('../models/Course');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// יצירת קובץ דמה לבדיקה
const testFilePath = path.join(__dirname, 'fixtures', 'dummy.txt');

beforeAll(async () => {
  // הכנת קובץ דמה
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, 'This is a test file content');
  }

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // ניקוי קובץ הבדיקה
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  
  await mongoose.connection.close();
  await mongo.stop();
});

beforeEach(async () => {
  // נקה את הDB לפני כל בדיקה
  await User.deleteMany({});
  await Course.deleteMany({});
});

// פונקציה עזר ליצירת JWT token תקין
const generateValidToken = (userId, role = 'Student') => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Upload Assignment Tests', () => {
  it('uploads a file on-time and returns isLate=false', async () => {
    // 1) יצירת משתמשים וקורס
    const teacher = await User.create({ 
      username: 'Teacher', 
      email: 't@example.com', 
      password: 'hashed', 
      role: 'Teacher' 
    });
    
    const student = await User.create({ 
      username: 'Student', 
      email: 's@example.com', 
      password: 'hashed', 
      role: 'Student' 
    });
    
    const course = await Course.create({
      name: 'Test Course',
      creditPoints: 3,
      instructions: 'Upload',
      deadline: new Date(Date.now() + 60 * 60 * 1000), // שעה קדימה
      teacherId: teacher._id,
    });

    // 2) יצירת token תקין
    const token = generateValidToken(student._id, 'Student');

    // 3) ביצוע הבקשה עם Authorization header
    const res = await request(app)
      .post(`/api/courses/${course._id}/upload-assignment`)
      .set('Authorization', `Bearer ${token}`)
      .field('comment', 'Test submission')
      .field('lastModified', Date.now().toString())
      .attach('file', testFilePath);

    // 4) בדיקת התוצאות
    expect(res.statusCode).toBe(201);
    expect(res.body.isLate).toBe(false);
    expect(res.body.assignment).toBeDefined();
    expect(res.body.assignment.fileName).toBe('dummy.txt');
    expect(res.body.assignment.studentId).toBe(student._id.toString());
  });

  it('uploads a file after deadline and returns isLate=true', async () => {
    // 1) יצירת משתמשים וקורס עם deadline בעבר
    const teacher = await User.create({ 
      username: 'Teacher2', 
      email: 't2@example.com', 
      password: 'hashed', 
      role: 'Teacher' 
    });
    
    const student = await User.create({ 
      username: 'Student2', 
      email: 's2@example.com', 
      password: 'hashed', 
      role: 'Student' 
    });
    
    const course = await Course.create({
      name: 'Late Test Course',
      creditPoints: 3,
      instructions: 'Upload',
      deadline: new Date(Date.now() - 60 * 60 * 1000), // שעה אחורה
      teacherId: teacher._id,
    });

    const token = generateValidToken(student._id, 'Student');

    const res = await request(app)
      .post(`/api/courses/${course._id}/upload-assignment`)
      .set('Authorization', `Bearer ${token}`)
      .field('comment', 'Late submission')
      .field('lastModified', Date.now().toString())
      .attach('file', testFilePath);

    expect(res.statusCode).toBe(201);
    expect(res.body.isLate).toBe(true);
    expect(res.body.assignment.isLateSubmission).toBe(true);
  });

  it('rejects upload without authentication', async () => {
    const teacher = await User.create({ 
      username: 'Teacher3', 
      email: 't3@example.com', 
      password: 'hashed', 
      role: 'Teacher' 
    });
    
    const course = await Course.create({
      name: 'Auth Test Course',
      creditPoints: 3,
      instructions: 'Upload',
      deadline: new Date(Date.now() + 60 * 60 * 1000),
      teacherId: teacher._id,
    });

    // בקשה ללא Authorization header - שינוי: בלי attach file כדי למנוע ECONNRESET
    const res = await request(app)
      .post(`/api/courses/${course._id}/upload-assignment`)
      .field('comment', 'Test without auth');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('Access denied');
  });

  it('rejects upload without file', async () => {
    const teacher = await User.create({ 
      username: 'Teacher4', 
      email: 't4@example.com', 
      password: 'hashed', 
      role: 'Teacher' 
    });
    
    const student = await User.create({ 
      username: 'Student4', 
      email: 's4@example.com', 
      password: 'hashed', 
      role: 'Student' 
    });
    
    const course = await Course.create({
      name: 'No File Test Course',
      creditPoints: 3,
      instructions: 'Upload',
      deadline: new Date(Date.now() + 60 * 60 * 1000),
      teacherId: teacher._id,
    });

    const token = generateValidToken(student._id, 'Student');

    // בקשה ללא קובץ
    const res = await request(app)
      .post(`/api/courses/${course._id}/upload-assignment`)
      .set('Authorization', `Bearer ${token}`)
      .field('comment', 'No file submission');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('No file uploaded');
  });

  it('uploads a file with correct deadline', async () => {
    // 1) יצירת משתמשים וקורס
    const teacher = await User.create({ 
      username: 'Teacher', 
      email: 't@example.com', 
      password: 'hashed', 
      role: 'Teacher' 
    });
    
    const student = await User.create({ 
      username: 'Student', 
      email: 's@example.com', 
      password: 'hashed', 
      role: 'Student' 
    });
    
    const course = await Course.create({
      name: 'Test Course',
      creditPoints: 3,
      instructions: 'Upload',
      deadline: new Date(Date.now() + 60 * 60 * 1000), // שעה קדימה
      teacherId: teacher._id,
    });

    // 2) יצירת token תקין
    const token = generateValidToken(student._id, 'Student');

    // 3) ביצוע הבקשה עם Authorization header
    const res = await request(app)
      .post(`/api/courses/${course._id}/upload-assignment`)
      .set('Authorization', `Bearer ${token}`)
      .field('deadline', course.deadline.toISOString())
      .attach('file', testFilePath);

    // 4) בדיקת התוצאות
    expect(res.statusCode).toBe(201);
    expect(res.body.isLate).toBe(false);
    expect(res.body.assignment).toBeDefined();
    expect(res.body.assignment.fileName).toBe('dummy.txt');
    expect(res.body.assignment.studentId).toBe(student._id.toString());
  });
});