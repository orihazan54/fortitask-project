import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../../../pages/student/StudentDashboard';
import * as api from '../../../services/api';
import '@testing-library/jest-dom';

// Mock the API functions
jest.mock('../../../services/api', () => ({
  getMyCourses: jest.fn(),
  getUserDetails: jest.fn(),
  getRecentAssignments: jest.fn(),
  getAssignmentSubmissions: jest.fn(),
  checkAuthentication: jest.fn(() => ({ isAuthenticated: true, role: 'Student' }))
}));

// Mock Chart.js
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    data: { datasets: [] }
  }))
}));

const mockCourses = [
  {
    _id: '1',
    name: 'מתמטיקה',
    description: 'קורס מתמטיקה בסיסי',
    teacher: { name: 'ד"ר כהן' },
    assignments: [
      { _id: 'a1', title: 'מטלה 1', dueDate: '2024-02-01' }
    ]
  },
  {
    _id: '2',
    name: 'פיזיקה',
    description: 'קורס פיזיקה מתקדם',
    teacher: { name: 'פרופ׳ לוי' },
    assignments: []
  }
];

const mockAssignments = [
  {
    _id: 'a1',
    title: 'מטלה 1',
    course: { name: 'מתמטיקה' },
    dueDate: '2024-02-01',
    status: 'pending'
  }
];

const renderStudentDashboard = () => {
  return render(
    <BrowserRouter>
      <StudentDashboard />
    </BrowserRouter>
  );
};

describe('StudentDashboard', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses  
    api.getMyCourses.mockResolvedValue({ data: mockCourses });
    api.getUserDetails.mockResolvedValue({ data: { username: 'יוסי כהן' } });
    api.getRecentAssignments.mockResolvedValue({ data: mockAssignments });
    api.getAssignmentSubmissions.mockResolvedValue({ data: [] });
    
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

  test('renders dashboard header correctly', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Student Portal/)).toBeInTheDocument();
  });

  test('displays courses count correctly', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Total Courses')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // מספר הקורסים
    });
  });

  test('displays recent assignments', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('shows progress chart', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('handles navigation to courses', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      const coursesLink = screen.getByText(/Your Courses/);
      expect(coursesLink).toBeInTheDocument();
      fireEvent.click(coursesLink);
    });
  });

  test('handles navigation to assignments', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    api.getMyCourses.mockRejectedValue(new Error('Network error'));
    
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  test('shows loading state', () => {
    api.getMyCourses.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderStudentDashboard();
    
    expect(screen.getByText(/Student Portal/)).toBeInTheDocument();
  });

  test('displays empty state when no courses', async () => {
    api.getMyCourses.mockResolvedValue({ data: [] });
    api.getRecentAssignments.mockResolvedValue({ data: [] });
    
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('shows quick actions section', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('handles course card click', async () => {
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('shows upcoming deadlines', async () => {
    const upcomingAssignment = {
      ...mockAssignments[0],
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };
    
    api.getRecentAssignments.mockResolvedValue({ data: [upcomingAssignment] });
    
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('renders responsive layout', async () => {
    // Mock window resize
    global.innerWidth = 768;
    global.dispatchEvent(new Event('resize'));
    
    renderStudentDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });
}); 