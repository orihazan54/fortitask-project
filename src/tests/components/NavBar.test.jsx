// Navigation bar testing for role-based access control and user session management
// Tests authentication states, route navigation, and user interface consistency

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from '../../components/NavBar';

// Mock React Router hooks for controlled navigation testing
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Helper function for rendering navigation component with routing context
const renderNavBar = () => {
  return render(
    <BrowserRouter>
      <NavBar />
    </BrowserRouter>
  );
};

// Navigation component comprehensive testing for authentication and user experience
describe('NavBar Component', () => {
  // Reset navigation mocks and authentication state
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Test brand identity and logo rendering
  test('renders logo and site name', () => {
    renderNavBar();
    
    expect(screen.getByText('Fortitask')).toBeInTheDocument();
    expect(screen.getByAltText('Fortitask Logo')).toBeInTheDocument();
  });

  // Test navigation context awareness for authentication pages
  test('shows home button on auth pages', () => {
    mockLocation.pathname = '/login';
    renderNavBar();
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  // Test authenticated user interface elements
  test('shows profile and logout for authenticated users', () => {
    localStorage.setItem('role', 'Student');
    mockLocation.pathname = '/student-dashboard';
    
    renderNavBar();
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  // Test secure logout functionality and session cleanup
  test('logout functionality works correctly', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('role', 'Teacher');
    mockLocation.pathname = '/teacher-dashboard';

    // Monitor localStorage operations for security validation
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');
    
    renderNavBar();
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(removeSpy).toHaveBeenCalledWith('token');
    expect(removeSpy).toHaveBeenCalledWith('role');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // Test role-based navigation for student users
  test('profile link redirects correctly for students', () => {
    localStorage.setItem('role', 'Student');
    mockLocation.pathname = '/student-dashboard';
    
    renderNavBar();
    
    const profileLink = screen.getByText('Profile');
    expect(profileLink.closest('a')).toHaveAttribute('href', '/student/profile');
  });

  // Test role-based navigation for teacher users
  test('profile link redirects correctly for teachers', () => {
    localStorage.setItem('role', 'Teacher');
    mockLocation.pathname = '/teacher-dashboard';
    
    renderNavBar();
    
    const profileLink = screen.getByText('Profile');
    expect(profileLink.closest('a')).toHaveAttribute('href', '/teacher/profile');
  });
});