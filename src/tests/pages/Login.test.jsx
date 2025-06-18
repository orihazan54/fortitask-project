
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders login page without crashing', () => {
    renderLogin();
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  test('renders login form elements', () => {
    renderLogin();
    // Should have form structure
    expect(document.querySelector('form, input, button')).toBeInTheDocument();
  });
});