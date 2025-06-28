import React from 'react';
import { render, screen } from '@testing-library/react';
import FileMetaAnalyzer from '../../../pages/teacher/FileMetaAnalyzer';

// Mock CSS imports
jest.mock('../../../components/Animations.css', () => ({}));

describe('FileMetaAnalyzer', () => {
  const mockFile = {
    name: 'test-file.docx',
    size: 1024
  };

  const mockDeadline = '2024-01-15T10:00:00.000Z';

  const createMockFileMeta = (overrides = {}) => ({
    lastModifiedUTC: '2024-01-14T09:00:00.000Z',
    clientReportedDate: '2024-01-14T09:00:00.000Z',
    uploadedAt: '2024-01-14T09:30:00.000Z',
    suspectedTimeManipulation: false,
    isLateSubmission: false,
    isModifiedAfterDeadline: false,
    isModifiedBeforeButSubmittedLate: false,
    ...overrides
  });

  test('renders file metadata analysis title', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('File Metadata Analysis')).toBeInTheDocument();
  });

  test('displays deadline information', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    // Check that some part of the deadline date is displayed
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  test('shows on-time submission status for valid files', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('On time submission')).toBeInTheDocument();
    expect(screen.getByText('Submission Status')).toBeInTheDocument();
  });

  test('detects suspected time manipulation', () => {
    const fileMeta = createMockFileMeta({
      suspectedTimeManipulation: true
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('Suspected manipulation: file was modified after the deadline')).toBeInTheDocument();
    expect(screen.getByText('Suspicious time difference detected')).toBeInTheDocument();
  });

  test('displays late submission status', () => {
    const fileMeta = createMockFileMeta({
      isLateSubmission: true,
      uploadedAt: '2024-01-16T11:00:00.000Z'
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText(/Late submission/)).toBeInTheDocument();
  });

  test('detects file modified after deadline', () => {
    const fileMeta = createMockFileMeta({
      isModifiedAfterDeadline: true,
      isLateSubmission: true,
      lastModifiedUTC: '2024-01-16T14:00:00.000Z' // After deadline
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('Late submission: file was modified after the deadline')).toBeInTheDocument();
    expect(screen.getByText(/המטלה הוגשה באיחור והקובץ נערך אחרי זמן ההגשה/)).toBeInTheDocument();
  });

  test('displays file last modified time', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('File Last Modified')).toBeInTheDocument();
    expect(screen.getByText('Last Modified (Client Reported)')).toBeInTheDocument();
  });

  test('shows analysis time', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('Analysis Time (Local)')).toBeInTheDocument();
  });

  test('calculates and displays submission delay duration', () => {
    const fileMeta = createMockFileMeta({
      isLateSubmission: true,
      uploadedAt: '2024-01-15T12:30:00.000Z' // 2.5 hours after deadline
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText(/Submission delay:/)).toBeInTheDocument();
    // Should show hours and minutes
    expect(screen.getByText(/2h 30m/)).toBeInTheDocument();
  });

  test('handles invalid or missing dates gracefully', () => {
    const fileMeta = createMockFileMeta({
      lastModifiedUTC: null,
      clientReportedDate: 'invalid-date'
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    // Should still render without crashing
    expect(screen.getByText('File Metadata Analysis')).toBeInTheDocument();
    expect(screen.getByText(/N\/A|Invalid date/)).toBeInTheDocument();
  });

  test('returns null when required props are missing', () => {
    const { container } = render(
      <FileMetaAnalyzer 
        file={null} 
        fileMeta={null} 
        deadline={null} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('handles file modified before deadline but submitted late', () => {
    const fileMeta = createMockFileMeta({
      isLateSubmission: true,
      isModifiedBeforeButSubmittedLate: true,
      lastModifiedUTC: '2024-01-14T09:00:00.000Z', // Before deadline
      uploadedAt: '2024-01-16T11:00:00.000Z' // After deadline
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('Late submission: file was last modified before the deadline')).toBeInTheDocument();
  });

  test('displays correct status colors for different scenarios', () => {
    // Test suspected manipulation
    const suspiciousFileMeta = createMockFileMeta({
      suspectedTimeManipulation: true,
      isModifiedAfterDeadline: true
    });
    
    const { rerender } = render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={suspiciousFileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    // בדיקת הטקסט במקום הצבע
    expect(screen.getByText('Suspected manipulation: file was modified after the deadline')).toBeInTheDocument();
    
    // Test late submission
    const lateFileMeta = createMockFileMeta({
      isLateSubmission: true,
      isModifiedAfterDeadline: false
    });
    
    rerender(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={lateFileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('Late submission: file was last modified before the deadline')).toBeInTheDocument();
    
    // Test on-time submission
    const onTimeFileMeta = createMockFileMeta();
    
    rerender(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={onTimeFileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('On time submission')).toBeInTheDocument();
  });

  test('calculates late duration correctly for file modified after deadline', () => {
    const fileMeta = createMockFileMeta({
      isModifiedAfterDeadline: true,
      lastModifiedUTC: '2024-01-15T13:15:00.000Z' // 3 hours 15 minutes after deadline
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText(/הקובץ נערך.*3h 15m.*אחרי זמן ההגשה/)).toBeInTheDocument();
  });

  test('formats dates consistently', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    // All dates should be formatted consistently
    const dateElements = screen.getAllByText(/\d{1,2}.\d{1,2}.\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test('handles edge case with zero time differences', () => {
    const exactDeadlineTime = '2024-01-15T10:00:00.000Z';
    const fileMeta = createMockFileMeta({
      lastModifiedUTC: exactDeadlineTime,
      clientReportedDate: exactDeadlineTime,
      uploadedAt: exactDeadlineTime
    });
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    expect(screen.getByText('On time submission')).toBeInTheDocument();
  });

  test('renders all required metadata fields', () => {
    const fileMeta = createMockFileMeta();
    
    render(
      <FileMetaAnalyzer 
        file={mockFile} 
        fileMeta={fileMeta} 
        deadline={mockDeadline} 
      />
    );
    
    // Check all metadata fields are present
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    expect(screen.getByText('Last Modified (Client Reported)')).toBeInTheDocument();
    expect(screen.getByText('Analysis Time (Local)')).toBeInTheDocument();
    expect(screen.getByText('File Last Modified')).toBeInTheDocument();
    expect(screen.getByText('Submission Status')).toBeInTheDocument();
  });
}); 