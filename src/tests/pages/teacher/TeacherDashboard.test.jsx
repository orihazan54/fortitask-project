import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeacherDashboard from '../../../pages/teacher/TeacherDashboard';
import * as api from '../../../services/api';
import { toast } from 'sonner';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ options, data }) => (
    <div role="img" aria-label="chart">
      Mocked Chart - {data.labels?.join(', ')}
    </div>
  ),
}));

// Mock API
jest.mock('../../../services/api');
jest.mock('sonner');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock data
const mockCourses = [
  {
    _id: 'course1',
    name: 'Advanced Mathematics',
    description: 'Advanced math course',
    teacher: 'teacher123',
    students: [
      { _id: 'student1', name: 'John Doe' },
      { _id: 'student2', name: 'Jane Smith' },
      { _id: 'student3', name: 'Bob Wilson' }
    ],
    assignments: [
      { _id: 'assignment1', title: 'Assignment 1' },
      { _id: 'assignment2', title: 'Assignment 2' }
    ]
  },
  {
    _id: 'course2', 
    name: 'Linear Algebra',
    description: 'Linear algebra course',
    teacher: 'teacher123',
    students: [
      { _id: 'student4', name: 'Alice Brown' },
      { _id: 'student5', name: 'Charlie Davis' }
    ],
    assignments: [
      { _id: 'assignment3', title: 'Assignment 3' }
    ]
  }
];

const renderTeacherDashboard = () => {
  return render(
    <BrowserRouter>
      <TeacherDashboard />
    </BrowserRouter>
  );
};

describe('TeacherDashboard', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    api.getCourses.mockResolvedValue({ data: mockCourses });
    api.getUserDetails.mockResolvedValue({ 
      data: { username: 'Dr. Smith' }
    });
    
    // Mock localStorage
    mockLocalStorage.getItem.mockReturnValue('teacher123');
    
    // Mock toast
    toast.success = jest.fn();
    toast.error = jest.fn();
  });

  test('renders dashboard correctly', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Dr. Smith!/)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Teacher Portal/)).toBeInTheDocument();
  });

  test('displays teacher statistics correctly', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      // Check for specific statistic cards by looking at the context
      expect(screen.getByText('Total Courses').previousElementSibling).toHaveTextContent('2');
      expect(screen.getByText('Total Students').previousElementSibling).toHaveTextContent('5');
      expect(screen.getByText('Assignments').previousElementSibling).toHaveTextContent('3');
    });
  });

  test('shows courses overview', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Your Courses')).toBeInTheDocument();
      expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Linear Algebra')).toBeInTheDocument();
    });
  });

  test('displays course statistics in table', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Linear Algebra')).toBeInTheDocument();
    });
    
    // Check student counts in table cells specifically
    const mathRow = screen.getByText('Advanced Mathematics').closest('tr');
    const algebraRow = screen.getByText('Linear Algebra').closest('tr');
    
    expect(mathRow.querySelector('td:last-child')).toHaveTextContent('3');
    expect(algebraRow.querySelector('td:last-child')).toHaveTextContent('2');
  });

  test('handles course selection', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      const courseRow = screen.getByText('Advanced Mathematics').closest('tr');
      expect(courseRow).toBeInTheDocument();
      fireEvent.click(courseRow);
    });
  });

  test('shows empty state when no courses', async () => {
    api.getCourses.mockResolvedValue({ data: [] });
    
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/No courses available/)).toBeInTheDocument();
      expect(screen.getByText(/Create your first course to get started/)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    api.getCourses.mockRejectedValue(new Error('Network error'));
    
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load courses.');
    });
  });

  test('displays default teacher name when user details fail', async () => {
    api.getUserDetails.mockRejectedValue(new Error('User not found'));
    
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Teacher!/)).toBeInTheDocument();
    });
  });

  test('calculates statistics correctly', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      // Check for specific statistic cards
      expect(screen.getByText('Total Courses').previousElementSibling).toHaveTextContent('2');
      expect(screen.getByText('Total Students').previousElementSibling).toHaveTextContent('5');
      expect(screen.getByText('Assignments').previousElementSibling).toHaveTextContent('3');
    });
  });

  test('handles missing user ID gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Teacher!/)).toBeInTheDocument();
    });
  });

  test('renders navigation sidebar', async () => {
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Manage Courses/)).toBeInTheDocument();
      expect(screen.getByText(/Create Course/)).toBeInTheDocument();
    });
  });

  test('handles course data with missing properties', async () => {
    const incompleteCourse = {
      _id: 'course3',
      name: 'Incomplete Course',
      // Missing students and assignments arrays
    };
    
    api.getCourses.mockResolvedValue({ data: [incompleteCourse] });
    
    renderTeacherDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Incomplete Course')).toBeInTheDocument();
      // Check in the table that it shows 0 students
      const tableCell = screen.getByText('Incomplete Course').closest('tr').querySelector('td:last-child');
      expect(tableCell).toHaveTextContent('0');
    });
  });
}); 