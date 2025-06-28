import * as api from '../../services/api';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn().mockReturnValue({ toString: () => 'encrypted-data' }),
    decrypt: jest.fn().mockReturnValue({ toString: () => '{"test": "data"}' })
  },
  enc: {
    Utf8: {}
  }
}));

// Mock axios with inline mock object
jest.mock('axios', () => {
  const mockAPI = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
  
  return {
    create: jest.fn(() => mockAPI),
    defaults: { withCredentials: true },
    __mockAPI: mockAPI
  };
});

describe('API Service Tests', () => {
  let mockAPI;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mock instance from axios
    const axios = require('axios');
    mockAPI = axios.__mockAPI;
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          if (key === 'token') return 'test-token';
          if (key === 'userId') return 'user123';
          if (key === 'role') return 'Student';
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });
  });

  describe('Authentication', () => {
    test('checkAuthentication returns correct state when logged in', () => {
      const result = api.checkAuthentication();
      
      expect(result).toEqual({
        isAuthenticated: true,
        userId: 'user123',
        role: 'Student'
      });
    });

    test('checkAuthentication returns false when not logged in', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = api.checkAuthentication();
      
      expect(result).toEqual({
        isAuthenticated: false,
        userId: null,
        role: null
      });
    });

    test('login function exists and is callable', () => {
      expect(typeof api.login).toBe('function');
    });

    test('signup function exists and is callable', () => {
      expect(typeof api.signup).toBe('function');
    });
  });

  describe('Course Management', () => {
    test('getCourses calls correct endpoint', async () => {
      const mockCourses = [{ _id: 'course1', name: 'Test Course' }];
      mockAPI.get.mockResolvedValue({ data: mockCourses });

      const result = await api.getCourses();

      expect(mockAPI.get).toHaveBeenCalledWith('/courses');
      expect(result.data).toEqual(mockCourses);
    });

    test('getMyCourses calls correct endpoint', async () => {
      const mockCourses = [{ _id: 'course1', name: 'My Course' }];
      mockAPI.get.mockResolvedValue({ data: mockCourses });

      const result = await api.getMyCourses();

      expect(mockAPI.get).toHaveBeenCalledWith('/courses/enrolled');
      expect(result.data).toEqual(mockCourses);
    });

    test('createCourse calls correct endpoint with form data', async () => {
      const formData = new FormData();
      formData.append('name', 'New Course');
      
      const mockResponse = { data: { _id: 'new-course', name: 'New Course' } };
      mockAPI.post.mockResolvedValue(mockResponse);

      const result = await api.createCourse(formData);

      expect(mockAPI.post).toHaveBeenCalledWith('/courses/create', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      expect(result).toEqual(mockResponse);
    });

    test('deleteCourse calls correct endpoint', async () => {
      const courseId = 'course123';
      const mockResponse = { data: { message: 'Course deleted' } };
      mockAPI.delete.mockResolvedValue(mockResponse);

      const result = await api.deleteCourse(courseId);

      expect(mockAPI.delete).toHaveBeenCalledWith(`/courses/${courseId}`);
      expect(result).toEqual(mockResponse);
    });

    test('getCourseDetails validates course ID', async () => {
      await expect(api.getCourseDetails(null)).rejects.toThrow('Invalid course ID');
      await expect(api.getCourseDetails('undefined')).rejects.toThrow('Invalid course ID');
      await expect(api.getCourseDetails('my-courses')).rejects.toThrow('Invalid course ID');
    });

    test('getCourseDetails calls correct endpoint with valid ID', async () => {
      const courseId = 'valid-course-id';
      const mockResponse = { data: { _id: courseId, name: 'Course Details' } };
      mockAPI.get.mockResolvedValue(mockResponse);

      const result = await api.getCourseDetails(courseId);

      expect(mockAPI.get).toHaveBeenCalledWith(`/courses/${courseId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Assignment Management', () => {
    test('uploadAssignment validates FormData has file', () => {
      const courseId = 'course123';
      const emptyFormData = new FormData();

      expect(() => {
        api.uploadAssignment(courseId, emptyFormData);
      }).toThrow('No file in upload data');
    });

    test('uploadAssignment calls correct endpoint with valid data', async () => {
      const courseId = 'course123';
      const formData = new FormData();
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', testFile);

      const mockResponse = { data: { message: 'Upload successful' } };
      mockAPI.post.mockResolvedValue(mockResponse);

      const result = await api.uploadAssignment(courseId, formData);

      expect(mockAPI.post).toHaveBeenCalledWith(
        `/courses/${courseId}/upload-assignment`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000
        }
      );
      expect(result).toEqual(mockResponse);
    });

    test('getAssignments calls correct endpoint', async () => {
      const courseId = 'course123';
      const mockAssignments = [{ _id: 'assignment1', fileName: 'test.pdf' }];
      mockAPI.get.mockResolvedValue({ data: mockAssignments });

      const result = await api.getAssignments(courseId);

      expect(mockAPI.get).toHaveBeenCalledWith(`/courses/${courseId}/assignments`);
      expect(result.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ displayFileName: expect.any(String) })
      ]));
    });

    test('deleteAssignment calls correct endpoint', async () => {
      const courseId = 'course123';
      const assignmentId = 'assignment456';
      const mockResponse = { data: { message: 'Assignment deleted' } };
      mockAPI.delete.mockResolvedValue(mockResponse);

      const result = await api.deleteAssignment(courseId, assignmentId);

      expect(mockAPI.delete).toHaveBeenCalledWith(`/courses/${courseId}/assignments/${assignmentId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('User Management', () => {
    test('getUserDetails function exists', () => {
      expect(typeof api.getUserDetails).toBe('function');
    });

    test('updateUserDetails function exists', () => {
      expect(typeof api.updateUserDetails).toBe('function');
    });

    test('sendPasswordResetEmail function exists', () => {
      expect(typeof api.sendPasswordResetEmail).toBe('function');
    });

    test('resetPassword function exists', () => {
      expect(typeof api.resetPassword).toBe('function');
    });
  });

  describe('Two Factor Authentication', () => {
    test('validateTwoFactorAuth function exists', () => {
      expect(typeof api.validateTwoFactorAuth).toBe('function');
    });

    test('setupTwoFactorAuth function exists', () => {
      expect(typeof api.setupTwoFactorAuth).toBe('function');
    });

    test('disableTwoFactorAuth function exists', () => {
      expect(typeof api.disableTwoFactorAuth).toBe('function');
    });
  });

  describe('Course Registration', () => {
    test('registerToCourse calls correct endpoint', async () => {
      const courseId = 'course123';
      const mockResponse = { data: { message: 'Registration successful' } };
      mockAPI.post.mockResolvedValue(mockResponse);

      const result = await api.registerToCourse(courseId);

      expect(mockAPI.post).toHaveBeenCalledWith(`/courses/register/${courseId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      const error = new Error('API Error');
      mockAPI.get.mockRejectedValue(error);

      await expect(api.getCourses()).rejects.toThrow('API Error');
    });

    test('handles network errors', async () => {
      const networkError = new Error('Network Error');
      mockAPI.get.mockRejectedValue(networkError);

      // getMyCourses has fallback logic, so it returns empty array instead of throwing
      const result = await api.getMyCourses();
      expect(result.data).toEqual([]);
    });
  });

  describe('Download Functionality', () => {
    test('downloadAssignment function exists', () => {
      expect(typeof api.downloadAssignment).toBe('function');
    });

    test('downloadAssignment handles missing file URL', async () => {
      const courseId = 'course123';
      const assignmentId = 'assignment456';
      const fileName = 'test.pdf';

      mockAPI.get.mockResolvedValue({ data: {} });

      const result = await api.downloadAssignment(courseId, assignmentId, fileName);

      expect(result).toBe(false);
    });
  });

  describe('Encryption Utilities', () => {
    test('encryptData function exists', () => {
      expect(typeof api.encryptData).toBe('function');
    });

    test('decryptData function exists', () => {
      expect(typeof api.decryptData).toBe('function');
    });
  });
}); 