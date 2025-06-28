import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManageCourses from '../../../pages/teacher/ManageCourses';
import * as api from '../../../services/api';
import { toast } from 'sonner';
import '@testing-library/jest-dom';

// Mock the API functions
jest.mock('../../../services/api', () => ({
  getCourses: jest.fn(),
  getAssignments: jest.fn(),
  deleteCourse: jest.fn(),
  updateCourse: jest.fn(),
  uploadAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
  checkAuthentication: jest.fn(() => ({ isAuthenticated: true, role: 'Teacher' }))
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}));

const mockCourses = [
  {
    _id: 'course1',
    name: 'Advanced Mathematics',
    description: 'Advanced Mathematics for students',
    students: [
      { _id: 'student1', name: 'John Doe', email: 'john@example.com' },
      { _id: 'student2', name: 'Jane Smith', email: 'jane@example.com' }
    ],
    assignments: [
      { 
        _id: 'assignment1', 
        title: 'Assignment 1', 
        dueDate: '2024-02-15T23:59:59Z',
        submissions: 1
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    _id: 'course2',
    name: 'Linear Algebra',
    description: 'Fundamentals of Linear Algebra',
    students: [
      { _id: 'student3', name: 'Bob Wilson', email: 'bob@example.com' }
    ],
    assignments: [],
    createdAt: '2024-01-15T00:00:00Z',
    isActive: true
  }
];

const renderManageCourses = () => {
  return render(
    <BrowserRouter>
      <ManageCourses />
    </BrowserRouter>
  );
};

describe('ManageCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    api.getCourses.mockResolvedValue({ data: mockCourses });
    api.getAssignments.mockResolvedValue({ 
      data: { 
        materials: [], 
        studentSubmissions: [] 
      } 
    });
    
    // Mock localStorage with proper format
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          const mockData = {
            userId: 'teacher123',
            token: 'mock-token',
            role: 'Teacher',
            username: 'Dr. Sarah Cohen'
          };
          return mockData[key] || null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  test('renders page title correctly', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('Manage Your Courses')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Your Courses')).toBeInTheDocument();
  });

  test('displays course dropdown', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('-- Select a Course --')).toBeInTheDocument();
    });
    
    // Check if courses are loaded
    expect(api.getCourses).toHaveBeenCalled();
  });

  test('shows back button', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  test('handles course selection', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      const dropdown = screen.getByDisplayValue('-- Select a Course --');
      expect(dropdown).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    api.getCourses.mockRejectedValue(new Error('Network error'));
    
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('Manage Your Courses')).toBeInTheDocument();
    });
  });

  test('displays empty state correctly', async () => {
    api.getCourses.mockResolvedValue({ data: [] });
    
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('-- Select a Course --')).toBeInTheDocument();
    });
  });

  test('shows loading state', () => {
    api.getCourses.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderManageCourses();
    
    expect(screen.getByText('Manage Your Courses')).toBeInTheDocument();
  });

  test('renders navigation correctly', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('Fortitask')).toBeInTheDocument();
    });
  });

  // Test that dropdown gets populated with courses
  test('course dropdown gets populated after API call', async () => {
    renderManageCourses();
    
    // Wait for courses to be loaded and dropdown to be populated
    await waitFor(() => {
      expect(api.getCourses).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Check that dropdown exists
    await waitFor(() => {
      expect(screen.getByDisplayValue('-- Select a Course --')).toBeInTheDocument();
    });
    
    // Check that course options are available (they come from mockCourses)
    await waitFor(() => {
      const dropdown = screen.getByDisplayValue('-- Select a Course --');
      const options = dropdown.querySelectorAll('option');
      // Should have 3 options: default + 2 courses
      expect(options).toHaveLength(3);
      expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Linear Algebra')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('dropdown triggers course selection handler', async () => {
    renderManageCourses();
    
    // Wait for courses to be loaded
    await waitFor(() => {
      expect(api.getCourses).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Wait for dropdown to exist
    await waitFor(() => {
      expect(screen.getByDisplayValue('-- Select a Course --')).toBeInTheDocument();
    });
    
    // Wait for courses to be populated
    await waitFor(() => {
      const dropdown = screen.getByDisplayValue('-- Select a Course --');
      const options = dropdown.querySelectorAll('option');
      expect(options).toHaveLength(3); // default + 2 courses
    }, { timeout: 3000 });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    
    // Change the dropdown value - this should trigger handleSelectCourse
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    // The getAssignments API should be called with the selected course
    await waitFor(() => {
      expect(api.getAssignments).toHaveBeenCalledWith('course1');
    }, { timeout: 3000 });
  });

  // Simplified tests that match what's actually in the component
  test('displays header elements', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('Manage Your Courses')).toBeInTheDocument();
      expect(screen.getByText('Your Courses')).toBeInTheDocument();
    });
  });

  test('renders without crashing', () => {
    renderManageCourses();
    expect(screen.getByText('Manage Your Courses')).toBeInTheDocument();
  });

  test('has proper page structure', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('-- Select a Course --')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  test('api is called on mount', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(api.getCourses).toHaveBeenCalled();
    });
  });

  test('handles empty course selection', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      const dropdown = screen.getByDisplayValue('-- Select a Course --');
      fireEvent.change(dropdown, { target: { value: '' } });
    });
    
    // Should not call getAssignments for empty selection
    expect(api.getAssignments).not.toHaveBeenCalledWith('');
  });

  test('back button is clickable', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
      fireEvent.click(backButton);
    });
  });

  test('dropdown shows placeholder text', async () => {
    renderManageCourses();
    
    await waitFor(() => {
      expect(screen.getByText('-- Select a Course --')).toBeInTheDocument();
    });
  });

  test('page loads with correct title', async () => {
    renderManageCourses();
    
    expect(screen.getByText('Manage Your Courses')).toBeInTheDocument();
  });
});