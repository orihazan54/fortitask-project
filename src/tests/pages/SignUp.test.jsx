
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignUp from '../../pages/SignUp';

const renderSignUp = () => {
  return render(
    <BrowserRouter>
      <SignUp />
    </BrowserRouter>
  );
};

describe('SignUp Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders signup page without crashing', () => {
    renderSignUp();
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  test('renders signup form elements', () => {
    renderSignUp();
    // Should have form structure
    expect(document.querySelector('form, input, button')).toBeInTheDocument();
  });
});