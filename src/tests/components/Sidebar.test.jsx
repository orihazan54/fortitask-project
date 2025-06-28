
// Role-based sidebar navigation testing for academic portal interface
// Tests student and teacher portal access, navigation structure, and route validation

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

// Helper function for rendering sidebar with role-specific context
const renderSidebar = (role) => {
  return render(
    <BrowserRouter>
      <Sidebar role={role} />
    </BrowserRouter>
  );
};

// Sidebar navigation component testing for role-based access control
describe('Sidebar Component', () => {
  // Test student portal interface and navigation elements
  test('renders student sidebar correctly', () => {
    renderSidebar('Student');
    
    expect(screen.getByText('Student Portal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Available Courses')).toBeInTheDocument();
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  // Test teacher portal interface and administrative navigation
  test('renders teacher sidebar correctly', () => {
    renderSidebar('Teacher');
    
    expect(screen.getByText('Teacher Portal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('View Students')).toBeInTheDocument();
    expect(screen.getByText('Manage Courses')).toBeInTheDocument();
    expect(screen.getByText('Create Course')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  // Test student navigation route accuracy and accessibility
  test('student sidebar has correct navigation links', () => {
    renderSidebar('Student');
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/student-dashboard');
    expect(screen.getByText('Available Courses').closest('a')).toHaveAttribute('href', '/student/courses');
    expect(screen.getByText('My Courses').closest('a')).toHaveAttribute('href', '/student/my-courses');
    expect(screen.getByText('My Profile').closest('a')).toHaveAttribute('href', '/student/profile');
  });

  // Test teacher navigation route accuracy and administrative access
  test('teacher sidebar has correct navigation links', () => {
    renderSidebar('Teacher');
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/teacher-dashboard');
    expect(screen.getByText('View Students').closest('a')).toHaveAttribute('href', '/teacher/view-students');
    expect(screen.getByText('Manage Courses').closest('a')).toHaveAttribute('href', '/teacher/manage-courses');
    expect(screen.getByText('Create Course').closest('a')).toHaveAttribute('href', '/teacher/create-course');
    expect(screen.getByText('My Profile').closest('a')).toHaveAttribute('href', '/teacher/profile');
  });

  // Test footer branding and copyright information
  test('displays copyright notice', () => {
    renderSidebar('Student');
    
    expect(screen.getByText('© 2025 Fortitask')).toBeInTheDocument();
  });
});