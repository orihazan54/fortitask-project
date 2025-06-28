import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import CourseDetails from '../../../pages/student/CourseDetails';
import * as api from '../../../services/api';

// Mock all dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../../../services/api', () => ({
  getCourseDetails: jest.fn(),
  uploadAssignment: jest.fn(),
  downloadAssignment: jest.fn(),
  deleteAssignment: jest.fn()
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ courseId: 'test-course-123' }),
  useNavigate: () => mockNavigate
}));

// Mock all component dependencies
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

jest.mock('../../../components/course/CourseHeader', () => {
  return function CourseHeader({ courseName }) {
    return <div data-testid="course-header">Course: {courseName}</div>;
  };
});

jest.mock('../../../components/course/CourseInformation', () => {
  return function CourseInformation({ creditPoints, teacherName, deadline }) {
    return (
      <div data-testid="course-information">
        <div>Credits: {creditPoints}</div>
        <div>Teacher: {teacherName}</div>
        <div>Deadline: {deadline}</div>
      </div>
    );
  };
});

jest.mock('../../../components/course/CourseMaterials', () => {
  return function CourseMaterials({ materials, onDownload }) {
    return (
      <div data-testid="course-materials">
        {materials?.map((material, index) => (
          <div key={index}>
            <span>{material.fileName}</span>
            <button onClick={() => onDownload(material)}>Download</button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../components/course/AssignmentUpload', () => {
  return function AssignmentUpload({ 
    onFileChange, 
    onUpload, 
    onCancel, 
    file, 
    uploading, 
    uploadComment, 
    setUploadComment 
  }) {
    return (
      <div data-testid="assignment-upload">
        <input 
          type="file" 
          onChange={onFileChange}
          data-testid="file-input"
        />
        <textarea 
          value={uploadComment}
          onChange={(e) => setUploadComment(e.target.value)}
          placeholder="Add comment"
          data-testid="upload-comment"
        />
        <button 
          onClick={onUpload} 
          disabled={uploading}
          data-testid="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
        {file && <div data-testid="selected-file">{file.name}</div>}
      </div>
    );
  };
});

jest.mock('../../../components/course/StudentSubmissions', () => {
  return function StudentSubmissions({ assignments, onDownload, onDelete }) {
    return (
      <div data-testid="student-submissions">
        {assignments?.map((assignment, index) => (
          <div key={index} data-testid={`submission-${index}`}>
            <span>{assignment.fileName}</span>
            <button onClick={() => onDownload(assignment)}>Download</button>
            <button onClick={() => onDelete(assignment)}>Delete</button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../components/course/DeleteConfirmationModal', () => {
  return function DeleteConfirmationModal({ isOpen, onConfirm, onCancel, fileName }) {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-modal">
        <p>Delete {fileName}?</p>
        <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-delete">Cancel</button>
      </div>
    );
  };
});

const renderCourseDetails = () => {
  return render(
    <BrowserRouter>
      <CourseDetails />
    </BrowserRouter>
  );
};

describe('CourseDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          if (key === 'userId') return 'student-123';
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when fetching course details', () => {
      api.getCourseDetails.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderCourseDetails();
      
      expect(screen.getByText('Loading course details...')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Course Data Loading', () => {
    test('loads and displays course details successfully', async () => {
      const mockCourse = {
        _id: 'test-course-123',
        name: 'Advanced Mathematics',
        creditPoints: 3,
        teacherId: 'teacher-456',
        teacherName: 'Dr. Smith',
        deadline: '2024-12-31',
        assignments: []
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(screen.getByTestId('course-header')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Course: Advanced Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Credits: 3')).toBeInTheDocument();
      expect(screen.getByText('Teacher: Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Deadline: 2024-12-31')).toBeInTheDocument();
    });

    test('handles course loading error', async () => {
      api.getCourseDetails.mockRejectedValue(new Error('Network error'));
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error loading course details');
      });
    });

    test('shows error state when course not found', async () => {
      api.getCourseDetails.mockResolvedValue({ data: null });
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(screen.getByText('Course Not Found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('The requested course could not be loaded.')).toBeInTheDocument();
      
      const backButton = screen.getByRole('button', { name: /back to my courses/i });
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/student/my-courses');
    });
  });

  describe('Course Materials', () => {
    test('displays course materials correctly', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'material-1',
            fileName: 'lecture1.pdf',
            isMaterial: true
          },
          {
            _id: 'material-2',
            fileName: 'slides.pptx'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(screen.getByTestId('course-materials')).toBeInTheDocument();
      });
    });

    test('handles material download', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'material-1',
            fileName: 'lecture1.pdf',
            originalFileName: 'lecture1.pdf'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      api.downloadAssignment.mockResolvedValue(true);
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(screen.getByTestId('course-materials')).toBeInTheDocument();
      });
      
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(api.downloadAssignment).toHaveBeenCalledWith(
          'test-course-123',
          'material-1',
          'lecture1.pdf'
        );
        expect(toast.success).toHaveBeenCalledWith('Download started');
      });
    });
  });

  describe('Assignment Upload', () => {
    beforeEach(async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: []
      };
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      await waitFor(() => {
        expect(screen.getByTestId('assignment-upload')).toBeInTheDocument();
      });
    });

    test('handles file selection', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-file')).toBeInTheDocument();
      });
    });

    test('handles successful file upload', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      const uploadButton = screen.getByTestId('upload-button');
      
      // Select file
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Mock successful upload
      api.uploadAssignment.mockResolvedValue({
        data: { isLate: false }
      });
      
      // Upload file
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(api.uploadAssignment).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Assignment submitted successfully!');
      });
    });

    test('handles late submission warning', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      const uploadButton = screen.getByTestId('upload-button');
      
      // Select file
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Mock late submission
      api.uploadAssignment.mockResolvedValue({
        data: { isLate: true }
      });
      
      // Upload file
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('Assignment submitted late.');
      });
    });

    test('handles upload error', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');
      const uploadButton = screen.getByTestId('upload-button');
      
      // Select file
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Mock upload failure
      api.uploadAssignment.mockRejectedValue(new Error('Upload failed'));
      
      // Upload file
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error uploading file. Please try again.');
      });
    });

    test('prevents upload without file selection', async () => {
      const uploadButton = screen.getByTestId('upload-button');
      
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select a file to upload');
      });
    });

    test('handles upload comment', async () => {
      const commentTextarea = screen.getByTestId('upload-comment');
      
      fireEvent.change(commentTextarea, { target: { value: 'This is my submission' } });
      
      expect(commentTextarea.value).toBe('This is my submission');
    });
  });

  describe('Student Submissions', () => {
    test('displays student submissions', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'my-homework.pdf',
            studentId: 'student-123'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(screen.getByTestId('student-submissions')).toBeInTheDocument();
      });
    });

    test('handles submission download', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'my-homework.pdf',
            studentId: 'student-123'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      api.downloadAssignment.mockResolvedValue(true);
      
      renderCourseDetails();
      
      await waitFor(() => {
        const downloadButtons = screen.getAllByText('Download');
        fireEvent.click(downloadButtons[0]);
      });
      
      await waitFor(() => {
        expect(api.downloadAssignment).toHaveBeenCalled();
      });
    });
  });

  describe('Assignment Deletion', () => {
    test('shows delete confirmation modal', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'my-homework.pdf',
            studentId: 'student-123'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });
      
      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
      expect(screen.getByText('Delete my-homework.pdf?')).toBeInTheDocument();
    });

    test('handles successful deletion', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'my-homework.pdf',
            studentId: 'student-123'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      api.deleteAssignment.mockResolvedValue();
      
      renderCourseDetails();
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });
      
      const confirmButton = screen.getByTestId('confirm-delete');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(api.deleteAssignment).toHaveBeenCalledWith('test-course-123', 'submission-1');
        expect(toast.success).toHaveBeenCalledWith('Assignment deleted successfully');
      });
    });

    test('prevents deletion of late submissions', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'late-homework.pdf',
            studentId: 'student-123',
            isLateSubmission: true
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Late submissions cannot be deleted');
      });
    });

    test('handles deletion error', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'my-homework.pdf',
            studentId: 'student-123'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      api.deleteAssignment.mockRejectedValue(new Error('Delete failed'));
      
      renderCourseDetails();
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });
      
      const confirmButton = screen.getByTestId('confirm-delete');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error deleting assignment');
      });
    });

    test('cancels deletion', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: [
          {
            _id: 'submission-1',
            fileName: 'my-homework.pdf',
            studentId: 'student-123'
          }
        ]
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });
      
      const cancelButton = screen.getByTestId('cancel-delete');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('renders all main components', async () => {
      const mockCourse = {
        name: 'Test Course',
        assignments: []
      };
      
      api.getCourseDetails.mockResolvedValue({ data: mockCourse });
      
      renderCourseDetails();
      
      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('course-header')).toBeInTheDocument();
        expect(screen.getByTestId('course-information')).toBeInTheDocument();
        expect(screen.getByTestId('course-materials')).toBeInTheDocument();
        expect(screen.getByTestId('assignment-upload')).toBeInTheDocument();
        expect(screen.getByTestId('student-submissions')).toBeInTheDocument();
      });
    });
  });
}); 