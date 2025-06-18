
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const renderSidebar = (role) => {
  return render(
    <BrowserRouter>
      <Sidebar role={role} />
    </BrowserRouter>
  );
};

describe('Sidebar Component', () => {
  test('renders student sidebar correctly', () => {
    renderSidebar('Student');
    
    expect(screen.getByText('Student Portal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Available Courses')).toBeInTheDocument();
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  test('renders teacher sidebar correctly', () => {
    renderSidebar('Teacher');
    
    expect(screen.getByText('Teacher Portal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('View Students')).toBeInTheDocument();
    expect(screen.getByText('Manage Courses')).toBeInTheDocument();
    expect(screen.getByText('Create Course')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  test('student sidebar has correct navigation links', () => {
    renderSidebar('Student');
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/student-dashboard');
    expect(screen.getByText('Available Courses').closest('a')).toHaveAttribute('href', '/student/courses');
    expect(screen.getByText('My Courses').closest('a')).toHaveAttribute('href', '/student/my-courses');
    expect(screen.getByText('My Profile').closest('a')).toHaveAttribute('href', '/student/profile');
  });

  test('teacher sidebar has correct navigation links', () => {
    renderSidebar('Teacher');
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/teacher-dashboard');
    expect(screen.getByText('View Students').closest('a')).toHaveAttribute('href', '/teacher/view-students');
    expect(screen.getByText('Manage Courses').closest('a')).toHaveAttribute('href', '/teacher/manage-courses');
    expect(screen.getByText('Create Course').closest('a')).toHaveAttribute('href', '/teacher/create-course');
    expect(screen.getByText('My Profile').closest('a')).toHaveAttribute('href', '/teacher/profile');
  });

  test('displays copyright notice', () => {
    renderSidebar('Student');
    
    expect(screen.getByText('© 2025 Fortitask')).toBeInTheDocument();
  });
});