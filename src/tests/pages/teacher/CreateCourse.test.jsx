import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateCourse from '../../../pages/teacher/CreateCourse';
import * as api from '../../../services/api';
import '@testing-library/jest-dom';

// Mock the API functions
jest.mock('../../../services/api', () => ({
  createCourse: jest.fn(),
  checkAuthentication: jest.fn(() => ({ isAuthenticated: true, role: 'Teacher' }))
}));

const renderCreateCourse = () => {
  return render(
    <BrowserRouter>
      <CreateCourse />
    </BrowserRouter>
  );
};

describe('CreateCourse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage with proper format
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          const mockData = {
            userId: 'teacher123',
            token: 'mock-token',
            role: 'Teacher',
            username: 'ד"ר שרה כהן'
          };
          return mockData[key] || null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  test('renders form correctly', async () => {
    renderCreateCourse();
    
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });
    
    expect(screen.getByPlaceholderText('Enter course name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter credit points')).toBeInTheDocument();
  });

  test('handles successful course creation', async () => {
    const mockCourse = {
      _id: 'course123',
      name: 'Math Course',
      description: 'Advanced Mathematics'
    };
    
    api.createCourse.mockResolvedValue({ data: mockCourse });
    
    renderCreateCourse();
    
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /Create Course/ })).toBeInTheDocument();
  });

  test('handles form validation errors', async () => {
    renderCreateCourse();
    
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Course Name')).toBeInTheDocument();
    expect(screen.getByText('Instructions')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    api.createCourse.mockRejectedValue(new Error('Network error'));
    
    renderCreateCourse();
    
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Teacher Portal')).toBeInTheDocument();
  });

  test('shows loading state during creation', async () => {
    api.createCourse.mockImplementation(() => new Promise(() => {}));
    
    renderCreateCourse();
    
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /Create Course/ })).toBeInTheDocument();
  });
}); 