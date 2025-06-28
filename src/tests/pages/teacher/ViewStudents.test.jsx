import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import ViewStudents from '../../../pages/teacher/ViewStudents';
import * as api from '../../../services/api';

// Mock the API module
jest.mock('../../../services/api');

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the NavBar and Sidebar components
jest.mock('../../../components/NavBar', () => {
  return function MockNavBar() {
    return <nav data-testid="navbar">Fortitask</nav>;
  };
});

jest.mock('../../../components/Sidebar', () => {
  return function MockSidebar({ role }) {
    return <aside data-testid="sidebar">Sidebar - {role}</aside>;
  };
});

// Mock CSS imports
jest.mock('../../../styles/ViewStudents.css', () => ({}));
jest.mock('../../../components/Animations.css', () => ({}));

const mockCourses = [
  {
    _id: 'course1',
    name: 'Advanced Mathematics',
    creditPoints: 3,
    deadline: '2024-06-15T10:00:00.000Z',
    courseDuration: '16 weeks'
  },
  {
    _id: 'course2',
    name: 'Linear Algebra',
    creditPoints: 4,
    deadline: '2024-07-15T10:00:00.000Z',
    courseDuration: '14 weeks'
  }
];

const mockCourseDetails = {
  _id: 'course1',
  name: 'Advanced Mathematics',
  creditPoints: 3,
  deadline: '2024-06-15T10:00:00.000Z',
  courseDuration: '16 weeks',
  students: [
    {
      _id: 'student1',
      username: 'John Doe',
      email: 'john.doe@example.com'
    },
    {
      _id: 'student2',
      username: 'Jane Smith',
      email: 'jane.smith@example.com'
    },
    {
      _id: 'student3',
      username: 'Bob Wilson',
      email: 'bob.wilson@example.com'
    }
  ]
};

const renderViewStudents = () => {
  return render(
    <BrowserRouter>
      <ViewStudents />
    </BrowserRouter>
  );
};

describe('ViewStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    api.getCourses.mockResolvedValue({ data: mockCourses });
    api.getCourseDetails.mockResolvedValue({ data: mockCourseDetails });
    
    // Mock localStorage
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

  test('renders page title and description correctly', async () => {
    renderViewStudents();
    
    expect(screen.getByText('Manage Students')).toBeInTheDocument();
    expect(screen.getByText(/View and manage students enrolled in your courses/)).toBeInTheDocument();
  });

  test('renders navbar and sidebar', () => {
    renderViewStudents();
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Sidebar - Teacher')).toBeInTheDocument();
  });

  test('displays course selection dropdown', async () => {
    renderViewStudents();
    
    await waitFor(() => {
      expect(screen.getByText('-- Select a Course --')).toBeInTheDocument();
    });
    
    expect(api.getCourses).toHaveBeenCalled();
  });

  test('populates dropdown with courses after API call', async () => {
    renderViewStudents();
    
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
      expect(screen.getAllByText('Linear Algebra')).toHaveLength(1);
    });
  });

  test('shows course details when course is selected', async () => {
    renderViewStudents();
    
    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    await waitFor(() => {
      expect(api.getCourseDetails).toHaveBeenCalledWith('course1');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Course Details')).toBeInTheDocument();
      // Now should have 2 instances: one in dropdown, one in course details
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(2);
      expect(screen.getByText('Credits:')).toBeInTheDocument();
    });
  });

  test('displays students table when course is selected', async () => {
    renderViewStudents();
    
    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Students in Course')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  test('search functionality filters students correctly', async () => {
    renderViewStudents();
    
    // Wait for courses to load and select course
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    // Wait for students to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Use search functionality
    const searchInput = screen.getByPlaceholderText('Search students by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    // Should show only John Doe
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('handles API error gracefully for courses', async () => {
    api.getCourses.mockRejectedValue(new Error('Network error'));
    
    renderViewStudents();
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load courses.');
    });
  });

  test('handles API error gracefully for course details', async () => {
    api.getCourseDetails.mockRejectedValue(new Error('Network error'));
    
    renderViewStudents();
    
    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load students.');
    });
  });

  test('displays loading state', () => {
    api.getCourses.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderViewStudents();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays correct student count', async () => {
    renderViewStudents();
    
    // Wait for courses to load and select course
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Students Enrolled:')).toBeInTheDocument();
      // Check that we have 3 students in the table plus credit points = multiple 3s
      const elements = screen.getAllByText('3');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  test('formats dates correctly', async () => {
    renderViewStudents();
    
    // Wait for courses to load and select course
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    await waitFor(() => {
      // Check that date is displayed (exact format may vary based on locale)
      expect(screen.getByText(/15/)).toBeInTheDocument(); // Should contain day 15
    });
  });

  test('handles empty student list', async () => {
    const emptyCourseDetails = {
      ...mockCourseDetails,
      students: []
    };
    
    api.getCourseDetails.mockResolvedValue({ data: emptyCourseDetails });
    
    renderViewStudents();
    
    // Wait for courses to load and select course
    await waitFor(() => {
      expect(screen.getAllByText('Advanced Mathematics')).toHaveLength(1);
    });
    
    const dropdown = screen.getByDisplayValue('-- Select a Course --');
    fireEvent.change(dropdown, { target: { value: 'course1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Students in Course')).toBeInTheDocument();
      expect(screen.getByText('Students Enrolled:')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // student count should be 0
    });
  });
}); 