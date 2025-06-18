import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from '../../components/NavBar';

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const renderNavBar = () => {
  return render(
    <BrowserRouter>
      <NavBar />
    </BrowserRouter>
  );
};

describe('NavBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders logo and site name', () => {
    renderNavBar();
    
    expect(screen.getByText('Fortitask')).toBeInTheDocument();
    expect(screen.getByAltText('Fortitask Logo')).toBeInTheDocument();
  });

  test('shows home button on auth pages', () => {
    mockLocation.pathname = '/login';
    renderNavBar();
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('shows profile and logout for authenticated users', () => {
    localStorage.setItem('role', 'Student');
    mockLocation.pathname = '/student-dashboard';
    
    renderNavBar();
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('logout functionality works correctly', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('role', 'Teacher');
    mockLocation.pathname = '/teacher-dashboard';

    // Spy on removeItem before rendering
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');
    
    renderNavBar();
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(removeSpy).toHaveBeenCalledWith('token');
    expect(removeSpy).toHaveBeenCalledWith('role');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('profile link redirects correctly for students', () => {
    localStorage.setItem('role', 'Student');
    mockLocation.pathname = '/student-dashboard';
    
    renderNavBar();
    
    const profileLink = screen.getByText('Profile');
    expect(profileLink.closest('a')).toHaveAttribute('href', '/student/profile');
  });

  test('profile link redirects correctly for teachers', () => {
    localStorage.setItem('role', 'Teacher');
    mockLocation.pathname = '/teacher-dashboard';
    
    renderNavBar();
    
    const profileLink = screen.getByText('Profile');
    expect(profileLink.closest('a')).toHaveAttribute('href', '/teacher/profile');
  });
});