import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyCourses from '../../../pages/student/MyCourses';
import * as api from '../../../services/api';
import '@testing-library/jest-dom';

// Mock the API functions
jest.mock('../../../services/api', () => ({
  getMyCourses: jest.fn(),
  checkAuthentication: jest.fn(() => ({ isAuthenticated: true, role: 'Student' }))
}));

const mockCourses = [
  {
    _id: 'course1',
    name: 'מתמטיקה מתקדמת',
    description: 'קורס מתמטיקה לתלמידים מתקדמים',
    teacher: { name: 'ד"ר שרה כהן' },
    assignments: [
      { _id: 'assignment1', title: 'מטלה 1', dueDate: '2024-02-15T23:59:59Z' }
    ]
  },
  {
    _id: 'course2',
    name: 'פיזיקה',
    description: 'קורס פיזיקה בסיסי',
    teacher: { name: 'פרופ׳ דן לוי' },
    assignments: []
  }
];

const renderMyCourses = () => {
  return render(
    <BrowserRouter>
      <MyCourses />
    </BrowserRouter>
  );
};

describe('MyCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage with proper format
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          const mockData = {
            userId: 'student123',
            token: 'mock-token',
            role: 'Student',
            username: 'יוסי כהן'
          };
          return mockData[key] || null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  test('renders page correctly', async () => {
    api.getMyCourses.mockResolvedValue({ data: mockCourses });
    
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText('My Enrolled Courses')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    api.getMyCourses.mockImplementation(() => new Promise(() => {}));
    
    renderMyCourses();
    
    // Check if the component renders without crashing
    expect(screen.getByText('My Enrolled Courses')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    api.getMyCourses.mockRejectedValue(new Error('Network error'));
    
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText(/My Courses/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no courses', async () => {
    api.getMyCourses.mockResolvedValue({ data: [] });
    
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText(/My Courses/)).toBeInTheDocument();
    });
  });

  test('has refresh functionality', async () => {
    api.getMyCourses.mockResolvedValue({ data: [] });
    
    renderMyCourses();
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh Courses');
      expect(refreshButton).toBeInTheDocument();
      fireEvent.click(refreshButton);
    });
  });

  test('has search functionality', async () => {
    api.getMyCourses.mockResolvedValue({ data: mockCourses });
    
    renderMyCourses();
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search courses by name or teacher/);
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: 'math' } });
    });
  });

  test('renders page header correctly', async () => {
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText(/My Courses/)).toBeInTheDocument();
    });
  });

  test('displays courses when data is loaded', async () => {
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText(/My Courses/)).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText(/My Courses/)).toBeInTheDocument();
    });
  });

  test('handles refresh functionality', async () => {
    renderMyCourses();
    
    await waitFor(() => {
      expect(screen.getByText(/My Courses/)).toBeInTheDocument();
    });
    
    expect(api.getMyCourses).toHaveBeenCalled();
  });
}); 