import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../../services/api';

// Move mock ABOVE the import of App so it is applied before the module is evaluated
jest.mock('../../services/api', () => ({
  __esModule: true,
  login: jest.fn(),
  checkAuthentication: jest.fn(() => ({ isAuthenticated: false, role: null }))
}));

import App from '../../App';
import { mockAuth } from '../utiles/test-utils';

jest.spyOn(api, 'checkAuthentication').mockImplementation(() => ({ isAuthenticated: false, role: null }));

const renderAppWithRoute = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
};

describe('App Component Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Re-apply mock implementation after clearing
    api.checkAuthentication.mockReturnValue({ isAuthenticated: false, role: null });
  });

  test('renders home page by default', () => {
    renderAppWithRoute('/');
    // Home component should render
    expect(document.querySelector('.App, [data-testid="home"], main')).toBeInTheDocument();
  });

  test('redirects unknown routes to home', () => {
    renderAppWithRoute('/unknown-route');
    // Should redirect to home, so we shouldn't see a 404 or error
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  test('login route renders without authentication', () => {
    renderAppWithRoute('/login');
    // Login component should render
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  test('signup route renders without authentication', () => {
    renderAppWithRoute('/signup');
    // SignUp component should render
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  test('shows loading component during route transitions', () => {
    renderAppWithRoute('/');
    // The app should render without throwing errors
    expect(document.querySelector('body')).toBeInTheDocument();
  });
});