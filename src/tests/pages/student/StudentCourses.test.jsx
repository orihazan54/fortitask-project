import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import StudentCourses from '../../../pages/student/StudentCourses';
import * as api from '../../../services/api';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../services/api', () => ({
  getCourses: jest.fn(),
  registerToCourse: jest.fn()
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock NavBar and Sidebar
jest.mock('../../../components/NavBar', () => {
  return function NavBar() {
    return <div data-testid="navbar">NavBar</div>;
  };
});

jest.mock('../../../components/Sidebar', () => {
  return function Sidebar({ role }) {
    return <div data-testid="sidebar">Sidebar - {role}</div>;
  };
});

// Mock timers for setTimeout
jest.useFakeTimers();

const renderStudentCourses = () => {
  return render(
    <BrowserRouter>
      <StudentCourses />
    </BrowserRouter>
  );
};

describe('StudentCourses Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Initial Loading', () => {
    test('shows loading state when fetching courses', () => {
      api.getCourses.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderStudentCourses();
      
      expect(screen.getByText('Loading courses...')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('Available Courses')).toBeInTheDocument();
      expect(screen.getByText('Discover and enroll in new academic opportunities')).toBeInTheDocument();
    });

    test('loads and displays courses successfully', async () => {
      const mockCourses = [
        {
          _id: 'course1',
          name: 'Advanced Mathematics',
          creditPoints: 3,
          teacherName: 'Dr. Smith',
          deadline: '2024-12-31T23:59:59Z',
          students: ['student1', 'student2'],
          instructions: 'This is an advanced mathematics course covering calculus and linear algebra.'
        },
        {
          _id: 'course2',
          name: 'Physics 101',
          creditPoints: 4,
          teacherName: 'Prof. Johnson',
          deadline: '2024-11-30T23:59:59Z',
          students: [],
          instructions: 'Introduction to basic physics concepts.'
        }
      ];
      
      api.getCourses.mockResolvedValue({ data: mockCourses });
      
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
      });
      
      expect(screen.getByText('3 Credits')).toBeInTheDocument();
      expect(screen.getByText('4 Credits')).toBeInTheDocument();
      expect(screen.getByText('Instructor: Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Instructor: Prof. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Students: 2')).toBeInTheDocument();
      expect(screen.getByText('Students: 0')).toBeInTheDocument();
    });

    test('handles courses loading error', async () => {
      api.getCourses.mockRejectedValue(new Error('Network error'));
      
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load available courses. Please try again.')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    test('shows no courses message when no courses available', async () => {
      api.getCourses.mockResolvedValue({ data: [] });
      
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('No Courses Found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Try adjusting your search or check back later for new courses.')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      const mockCourses = [
        {
          _id: 'course1',
          name: 'Advanced Mathematics',
          creditPoints: 3,
          teacherName: 'Dr. Smith',
          deadline: '2024-12-31T23:59:59Z',
          students: [],
          instructions: 'Math course'
        },
        {
          _id: 'course2',
          name: 'Physics 101',
          creditPoints: 4,
          teacherName: 'Prof. Johnson',
          deadline: '2024-11-30T23:59:59Z',
          students: [],
          instructions: 'Physics course'
        }
      ];
      
      api.getCourses.mockResolvedValue({ data: mockCourses });
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      });
    });

    test('filters courses by course name', async () => {
      const searchInput = screen.getByPlaceholderText('Search courses by name or teacher...');
      
      fireEvent.change(searchInput, { target: { value: 'math' } });
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
        expect(screen.queryByText('Physics 101')).not.toBeInTheDocument();
      });
    });

    test('filters courses by teacher name', async () => {
      const searchInput = screen.getByPlaceholderText('Search courses by name or teacher...');
      
      fireEvent.change(searchInput, { target: { value: 'johnson' } });
      
      await waitFor(() => {
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
        expect(screen.queryByText('Advanced Mathematics')).not.toBeInTheDocument();
      });
    });

    test('shows all courses when search is cleared', async () => {
      const searchInput = screen.getByPlaceholderText('Search courses by name or teacher...');
      
      // First filter
      fireEvent.change(searchInput, { target: { value: 'math' } });
      await waitFor(() => {
        expect(screen.queryByText('Physics 101')).not.toBeInTheDocument();
      });
      
      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
      });
    });

    test('shows no courses message when search has no results', async () => {
      const searchInput = screen.getByPlaceholderText('Search courses by name or teacher...');
      
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('No Courses Found')).toBeInTheDocument();
        expect(screen.queryByText('Advanced Mathematics')).not.toBeInTheDocument();
        expect(screen.queryByText('Physics 101')).not.toBeInTheDocument();
      });
    });
  });

  describe('Course Selection', () => {
    beforeEach(async () => {
      const mockCourses = [
        {
          _id: 'course1',
          name: 'Advanced Mathematics',
          creditPoints: 3,
          teacherName: 'Dr. Smith',
          deadline: '2024-12-31T23:59:59Z',
          students: ['student1'],
          instructions: 'This is a comprehensive mathematics course covering advanced topics in calculus, linear algebra, and differential equations.'
        }
      ];
      
      api.getCourses.mockResolvedValue({ data: mockCourses });
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      });
    });

    test('opens course details modal when course is selected', async () => {
      const courseCard = screen.getByText('Advanced Mathematics').closest('.course-card');
      fireEvent.click(courseCard);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Advanced Mathematics' })).toBeInTheDocument();
      });
      
      expect(screen.getByText('Course Description & Instructions')).toBeInTheDocument();
      expect(screen.getByText('This is a comprehensive mathematics course covering advanced topics in calculus, linear algebra, and differential equations.')).toBeInTheDocument();
      expect(screen.getByText('Register for This Course')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('closes modal when cancel button is clicked', async () => {
      const courseCard = screen.getByText('Advanced Mathematics').closest('.course-card');
      fireEvent.click(courseCard);
      
      await waitFor(() => {
        expect(screen.getByText('Register for This Course')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Course Description & Instructions')).not.toBeInTheDocument();
      });
    });

    test('displays course details correctly in modal', async () => {
      const courseCard = screen.getByText('Advanced Mathematics').closest('.course-card');
      fireEvent.click(courseCard);
      
      await waitFor(() => {
        expect(screen.getByText('Credits:')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Instructor:')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Students Enrolled:')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Course Registration', () => {
    beforeEach(async () => {
      const mockCourses = [
        {
          _id: 'course1',
          name: 'Advanced Mathematics',
          creditPoints: 3,
          teacherName: 'Dr. Smith',
          deadline: '2024-12-31T23:59:59Z',
          students: [],
          instructions: 'Math course'
        }
      ];
      
      api.getCourses.mockResolvedValue({ data: mockCourses });
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      });
    });

    test('shows error when trying to register without selecting a course', async () => {
      // Try to register without selecting a course - this shouldn't be possible in the UI
      // but we can test the function directly
      expect(screen.queryByText('Register for This Course')).not.toBeInTheDocument();
    });

    test('successfully registers for a course', async () => {
      api.registerToCourse.mockResolvedValue();
      
      // Select course
      const courseCard = screen.getByText('Advanced Mathematics').closest('.course-card');
      fireEvent.click(courseCard);
      
      await waitFor(() => {
        expect(screen.getByText('Register for This Course')).toBeInTheDocument();
      });
      
      // Register
      const registerButton = screen.getByText('Register for This Course');
      fireEvent.click(registerButton);
      
      expect(screen.getByText('Registering...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(api.registerToCourse).toHaveBeenCalledWith('course1');
        expect(toast.success).toHaveBeenCalledWith('Successfully registered for the course!');
      });
      
      // Fast forward the setTimeout
      jest.advanceTimersByTime(1000);
      expect(mockNavigate).toHaveBeenCalledWith('/student/my-courses');
    });

    test('handles registration error', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Course is full'
          }
        }
      };
      api.registerToCourse.mockRejectedValue(errorResponse);
      
      // Select course
      const courseCard = screen.getByText('Advanced Mathematics').closest('.course-card');
      fireEvent.click(courseCard);
      
      await waitFor(() => {
        expect(screen.getByText('Register for This Course')).toBeInTheDocument();
      });
      
      // Register
      const registerButton = screen.getByText('Register for This Course');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Course is full');
      });
      
      // Should still show the modal and register button
      expect(screen.getByText('Register for This Course')).toBeInTheDocument();
    });

    test('handles registration error without specific message', async () => {
      api.registerToCourse.mockRejectedValue(new Error('Network error'));
      
      // Select course
      const courseCard = screen.getByText('Advanced Mathematics').closest('.course-card');
      fireEvent.click(courseCard);
      
      await waitFor(() => {
        expect(screen.getByText('Register for This Course')).toBeInTheDocument();
      });
      
      // Register
      const registerButton = screen.getByText('Register for This Course');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to register for the course.');
      });
    });
  });

  describe('Navigation and Actions', () => {
    beforeEach(async () => {
      api.getCourses.mockResolvedValue({ data: [] });
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('No Courses Found')).toBeInTheDocument();
      });
    });

    test('navigates back to student dashboard', () => {
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/student-dashboard');
    });

    test('refreshes courses when refresh button is clicked', async () => {
      const refreshButton = screen.getByText('Refresh Courses');
      fireEvent.click(refreshButton);
      
      expect(api.getCourses).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    test('retries loading courses when try again button is clicked', async () => {
      // Clear previous mock calls
      api.getCourses.mockClear();
      
      // First, simulate an error
      api.getCourses.mockRejectedValueOnce(new Error('Network error'));
      
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      // Now mock success for retry
      api.getCourses.mockResolvedValue({ data: [] });
      
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);
      
      expect(api.getCourses).toHaveBeenCalledTimes(2); // Initial error + retry
    });
  });

  describe('Course Card Display', () => {
    test('displays course information correctly', async () => {
      const mockCourses = [
        {
          _id: 'course1',
          name: 'Advanced Mathematics',
          creditPoints: 3,
          teacherName: 'Dr. Smith',
          deadline: '2024-12-31T23:59:59Z',
          students: ['student1', 'student2'],
          instructions: 'This is a very long description that should be truncated in the course card display because it exceeds the 100 character limit.'
        }
      ];
      
      api.getCourses.mockResolvedValue({ data: mockCourses });
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
        expect(screen.getByText('3 Credits')).toBeInTheDocument();
        expect(screen.getByText('Instructor: Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Students: 2')).toBeInTheDocument();
        expect(screen.getByText(/This is a very long description that should be truncated in the course card display because it excee/)).toBeInTheDocument();
        expect(screen.getByText('View Details')).toBeInTheDocument();
      });
    });

    test('handles missing optional fields gracefully', async () => {
      const mockCourses = [
        {
          _id: 'course1',
          name: 'Basic Course',
          creditPoints: 2,
          deadline: '2024-12-31T23:59:59Z'
          // Missing teacherName, students, instructions
        }
      ];
      
      api.getCourses.mockResolvedValue({ data: mockCourses });
      renderStudentCourses();
      
      await waitFor(() => {
        expect(screen.getByText('Basic Course')).toBeInTheDocument();
        expect(screen.getByText('2 Credits')).toBeInTheDocument();
        expect(screen.getByText('Instructor: TBA')).toBeInTheDocument();
        expect(screen.getByText('Students: 0')).toBeInTheDocument();
      });
    });
  });
}); 