import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssignmentUpload from '../../../components/course/AssignmentUpload';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: ({ size, className, ...props }) => (
    <svg 
      {...props} 
      data-testid="upload-icon" 
      width={size} 
      height={size}
      className={`lucide lucide-upload ${className || ''}`}
    />
  ),
  AlertTriangle: ({ size, ...props }) => (
    <svg 
      {...props} 
      data-testid="alert-triangle-icon" 
      width={size} 
      height={size}
      className="lucide lucide-alert-triangle"
    />
  ),
}));

const mockProps = {
  onFileChange: jest.fn(),
  onUpload: jest.fn(),
  onCancel: jest.fn(),
  file: null,
  uploading: false,
  uploadComment: '',
  setUploadComment: jest.fn(),
  uploadError: null
};

describe('AssignmentUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    test('renders upload section with correct title', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      expect(screen.getByText('Submit Your Assignment')).toBeInTheDocument();
    });

    test('renders upload box with correct text', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      expect(screen.getByText('Drag & drop a file here or click to choose')).toBeInTheDocument();
    });

    test('renders upload icons correctly', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const icons = screen.getAllByTestId('upload-icon');
      expect(icons).toHaveLength(2);
      expect(icons[0]).toHaveAttribute('width', '20');
      expect(icons[1]).toHaveAttribute('width', '24');
    });

    test('renders file input element', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle('display: none');
    });

    test('has correct CSS classes', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      expect(screen.getByText('Submit Your Assignment').closest('.upload-section')).toBeInTheDocument();
      expect(screen.getByText('Drag & drop a file here or click to choose').closest('.upload-inner').parentElement.parentElement).toHaveClass('file-upload-box');
    });
  });

  describe('File Selection', () => {
    test('calls onFileChange when file is selected', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockProps.onFileChange).toHaveBeenCalledTimes(1);
    });

    test('does not call onFileChange when no file is selected', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [] } });
      
      expect(mockProps.onFileChange).not.toHaveBeenCalled();
    });

    test('handles file selection with proper file object', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test content'], 'document.pdf', { 
        type: 'application/pdf',
        lastModified: Date.now()
      });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockProps.onFileChange).toHaveBeenCalledTimes(1);
    });

    test('handles multiple files by selecting first one', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const files = [
        new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['test2'], 'test2.pdf', { type: 'application/pdf' })
      ];
      
      fireEvent.change(fileInput, { target: { files } });
      
      expect(mockProps.onFileChange).toHaveBeenCalledTimes(1);
    });

    test('logs file selection for debugging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<AssignmentUpload {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test content'], 'debug.pdf', { 
        type: 'application/pdf'
      });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'AssignmentUpload: File selected',
        expect.objectContaining({
          name: 'debug.pdf',
          type: 'application/pdf'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });



  describe('Drag and Drop Functionality', () => {
    test('handles drag enter event', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const dropZone = screen.getByText('Drag & drop a file here or click to choose').closest('.file-upload-box');
      
      fireEvent.dragEnter(dropZone);
      
      expect(dropZone).toHaveClass('dragging');
    });

    test('handles drag leave event', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const dropZone = screen.getByText('Drag & drop a file here or click to choose').closest('.file-upload-box');
      
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('dragging');
      
      fireEvent.dragLeave(dropZone, { relatedTarget: null });
      expect(dropZone).not.toHaveClass('dragging');
    });

    test('handles drag over event', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const dropZone = screen.getByText('Drag & drop a file here or click to choose').closest('.file-upload-box');
      
      const dragOverEvent = new Event('dragover', { bubbles: true });
      Object.assign(dragOverEvent, { preventDefault: jest.fn() });
      
      fireEvent(dropZone, dragOverEvent);
      
      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    });

    test('handles file drop event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<AssignmentUpload {...mockProps} />);
      
      const dropZone = screen.getByText('Drag & drop a file here or click to choose').closest('.file-upload-box');
      const file = new File(['test'], 'dropped.pdf', { type: 'application/pdf' });
      
      fireEvent.dragEnter(dropZone);
      fireEvent.drop(dropZone, { 
        dataTransfer: { files: [file] }
      });
      
      expect(mockProps.onFileChange).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'AssignmentUpload: File dropped',
        expect.objectContaining({
          name: 'dropped.pdf'
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('updates text when dragging', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const dropZone = screen.getByText('Drag & drop a file here or click to choose').closest('.file-upload-box');
      
      fireEvent.dragEnter(dropZone);
      
      expect(screen.getByText('Drop your file here')).toBeInTheDocument();
    });
  });

  describe('File Display and Actions', () => {
    const mockFile = new File(['test'], 'test-document.pdf', { 
      type: 'application/pdf',
      lastModified: 1640995200000 // Jan 1, 2022
    });

    test('displays selected file information', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} />);
      
      expect(screen.getByText(/Selected file: test-document.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/Last modified/)).toBeInTheDocument();
    });

    test('displays file size correctly', () => {
      const smallFile = new File(['x'.repeat(500)], 'small.txt', { type: 'text/plain' });
      render(<AssignmentUpload {...mockProps} file={smallFile} />);
      
      expect(screen.getByText(/500 B/)).toBeInTheDocument();
    });

    test('displays file size in KB for larger files', () => {
      const mediumFile = new File(['x'.repeat(2048)], 'medium.txt', { type: 'text/plain' });
      render(<AssignmentUpload {...mockProps} file={mediumFile} />);
      
      expect(screen.getByText(/2.00 KB/)).toBeInTheDocument();
    });

    test('displays file size in MB for very large files', () => {
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
      render(<AssignmentUpload {...mockProps} file={largeFile} />);
      
      expect(screen.getByText(/2.00 MB/)).toBeInTheDocument();
    });

    test('handles file with unknown size', () => {
      const fileWithoutSize = { name: 'test.pdf', size: undefined };
      render(<AssignmentUpload {...mockProps} file={fileWithoutSize} />);
      
      expect(screen.getByText(/Unknown size/)).toBeInTheDocument();
    });

    test('renders comment textarea when file is selected', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} />);
      
      const textarea = screen.getByLabelText(/Comment \(optional\):/);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Add a comment about your submission');
    });

    test('calls setUploadComment when comment changes', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} />);
      
      const textarea = screen.getByLabelText(/Comment \(optional\):/);
      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      
      expect(mockProps.setUploadComment).toHaveBeenCalledWith('Test comment');
    });

    test('renders upload and cancel buttons when file is selected', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} />);
      
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('calls onUpload when upload button is clicked', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} />);
      
      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);
      
      expect(mockProps.onUpload).toHaveBeenCalledTimes(1);
    });

    test('calls onCancel when cancel button is clicked', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Upload States', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    test('shows uploading state when uploading is true', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} uploading={true} />);
      
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    test('disables buttons when uploading', () => {
      render(<AssignmentUpload {...mockProps} file={mockFile} uploading={true} />);
      
      const uploadButton = screen.getByText('Uploading...');
      const cancelButton = screen.getByText('Cancel');
      
      expect(uploadButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    test('displays upload error when present', () => {
      const errorMessage = 'Upload failed due to network error';
      render(<AssignmentUpload {...mockProps} uploadError={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    test('does not display error when uploadError is null', () => {
      render(<AssignmentUpload {...mockProps} uploadError={null} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles file with no lastModified property', () => {
      const fileWithoutDate = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileWithoutDate, 'lastModified', { value: undefined });
      
      render(<AssignmentUpload {...mockProps} file={fileWithoutDate} />);
      
      expect(screen.getByText(/Unknown/)).toBeInTheDocument();
    });

    test('handles comment with current value', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      render(<AssignmentUpload {...mockProps} file={mockFile} uploadComment="Existing comment" />);
      
      const textarea = screen.getByLabelText(/Comment \(optional\):/);
      expect(textarea).toHaveValue('Existing comment');
    });

    test('handles drag events correctly', () => {
      render(<AssignmentUpload {...mockProps} />);
      
      const dropZone = screen.getByText('Drag & drop a file here or click to choose').closest('.file-upload-box');
      
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('dragging');
      
      fireEvent.dragLeave(dropZone, { relatedTarget: null });
      expect(dropZone).not.toHaveClass('dragging');
      
      fireEvent.drop(dropZone, { dataTransfer: { files: [] } });
      expect(mockProps.onFileChange).not.toHaveBeenCalled();
    });
  });
}); 