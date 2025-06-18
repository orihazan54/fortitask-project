
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Custom render function that includes Router provider
export const renderWithRouter = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock authentication functions
export const mockAuth = {
  authenticated: (role = 'Student') => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', role);
  },
  unauthenticated: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }
};

// Common test data
export const mockCourseData = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Introduction to Programming',
  description: 'Learn the basics of programming',
  teacher: 'John Doe',
  students: ['student1', 'student2'],
  assignments: [
    {
      _id: 'assignment1',
      title: 'First Assignment',
      description: 'Basic programming exercises',
      dueDate: '2025-01-20'
    }
  ]
};

export const mockUserData = {
  student: {
    _id: 'student123',
    username: 'teststudent',
    email: 'student@test.com',
    role: 'Student'
  },
  teacher: {
    _id: 'teacher123',
    username: 'testteacher',
    email: 'teacher@test.com',
    role: 'Teacher'
  }
};

// Mock API responses
export const mockApiResponses = {
  courses: {
    success: { data: [mockCourseData] },
    empty: { data: [] },
    error: { error: 'Failed to fetch courses' }
  },
  auth: {
    success: { token: 'mock-token', role: 'Student' },
    error: { error: 'Invalid credentials' }
  }
};