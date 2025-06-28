import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CourseHeader from '../../../components/course/CourseHeader';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ArrowLeft: ({ size, ...props }) => (
    <svg 
      {...props} 
      data-testid="arrow-left-icon" 
      width={size} 
      height={size}
      className="lucide lucide-arrow-left"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  ),
}));

describe('CourseHeader Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  const renderCourseHeader = (props = {}) => {
    const defaultProps = {
      courseName: 'Mathematics 101',
      ...props
    };

    return render(
      <MemoryRouter>
        <CourseHeader {...defaultProps} />
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders the course header container with correct class', () => {
      const { container } = renderCourseHeader();
      const headerDiv = container.firstChild;
      
      expect(headerDiv).toHaveClass('course-header');
    });

    test('renders course name in heading', () => {
      renderCourseHeader({ courseName: 'Advanced Physics' });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Advanced Physics');
      expect(heading).toHaveClass('course-title');
    });

    test('renders back button with correct structure', () => {
      renderCourseHeader();
      
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveClass('back-button');
      
      const arrowIcon = screen.getByTestId('arrow-left-icon');
      expect(arrowIcon).toBeInTheDocument();
      
      const backText = screen.getByText('Back');
      expect(backText).toBeInTheDocument();
    });

    test('displays ArrowLeft icon with correct size', () => {
      renderCourseHeader();
      
      const icon = screen.getByTestId('arrow-left-icon');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });
  });

  describe('Navigation Functionality', () => {
    test('navigates to student courses page when back button is clicked', () => {
      renderCourseHeader();
      
      const backButton = screen.getByRole('button');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/student/my-courses');
    });

    test('can handle multiple click events on back button', () => {
      renderCourseHeader();
      
      const backButton = screen.getByRole('button');
      fireEvent.click(backButton);
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/student/my-courses');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/student/my-courses');
    });
  });

  describe('Props Handling', () => {
    test('handles empty course name', () => {
      renderCourseHeader({ courseName: '' });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('');
    });

    test('handles undefined course name', () => {
      renderCourseHeader({ courseName: undefined });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    test('handles null course name', () => {
      renderCourseHeader({ courseName: null });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    test('renders long course names correctly', () => {
      const longCourseName = 'Advanced Quantum Mechanics and Theoretical Physics for Graduate Students';
      renderCourseHeader({ courseName: longCourseName });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(longCourseName);
    });

    test('handles special characters in course name', () => {
      const specialCourseName = 'Math & Science: Level 1 (2024) - Advanced';
      renderCourseHeader({ courseName: specialCourseName });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(specialCourseName);
    });

    test('handles course names with HTML entities', () => {
      const courseNameWithEntities = 'Biology > Chemistry & Physics';
      renderCourseHeader({ courseName: courseNameWithEntities });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(courseNameWithEntities);
    });

    test('handles numeric course names', () => {
      renderCourseHeader({ courseName: '101' });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('101');
    });
  });

  describe('Accessibility', () => {
    test('back button is accessible via keyboard', () => {
      renderCourseHeader();
      
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
      
      // Simulate keyboard navigation
      backButton.focus();
      expect(document.activeElement).toBe(backButton);
    });

    test('heading has correct semantic structure', () => {
      renderCourseHeader();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.tagName).toBe('H2');
    });

    test('provides proper screen reader content', () => {
      renderCourseHeader({ courseName: 'Test Course' });
      
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { name: 'Test Course' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('works within Router context', () => {
      // This test ensures the component doesn't break outside of routing context
      expect(() => renderCourseHeader()).not.toThrow();
    });

    test('maintains consistent state across re-renders', () => {
      const { rerender } = renderCourseHeader({ courseName: 'Original Course' });
      
      let heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Original Course');
      
      rerender(
        <MemoryRouter>
          <CourseHeader courseName="Updated Course" />
        </MemoryRouter>
      );
      
      heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Updated Course');
    });

    test('preserves click handler across re-renders', () => {
      const { rerender } = renderCourseHeader({ courseName: 'Course 1' });
      
      const backButton = screen.getByRole('button');
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      
      rerender(
        <MemoryRouter>
          <CourseHeader courseName="Course 2" />
        </MemoryRouter>
      );
      
      const updatedBackButton = screen.getByRole('button');
      fireEvent.click(updatedBackButton);
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    test('handles rapid multiple clicks on back button', () => {
      renderCourseHeader();
      const backButton = screen.getByRole('button');
      
      // Simulate rapid clicks
      fireEvent.click(backButton);
      fireEvent.click(backButton);
      fireEvent.click(backButton);
      
      // Should handle multiple navigation calls
      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledWith('/student/my-courses');
      
      // Component should remain stable
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('maintains functionality after mock reset', () => {
      renderCourseHeader();
      const backButton = screen.getByRole('button');
      
      // Click once
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      
      // Reset mock and click again
      mockNavigate.mockClear();
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/student/my-courses');
    });
  });

  describe('Performance', () => {
    test('renders efficiently with minimal DOM elements', () => {
      const { container } = renderCourseHeader();
      
      // Should only have necessary DOM elements
      const headerDiv = container.querySelector('.course-header');
      const backButton = container.querySelector('.back-button');
      const heading = container.querySelector('.course-title');
      
      expect(headerDiv).toBeInTheDocument();
      expect(backButton).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      
      // Should not have excessive nested elements
      expect(container.querySelectorAll('*').length).toBeLessThan(10);
    });
  });
}); 