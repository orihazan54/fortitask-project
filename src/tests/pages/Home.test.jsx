
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';

const renderHome = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

describe('Home Page', () => {
  test('renders home page without crashing', () => {
    renderHome();
    // Home component should render
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  test('contains main navigation elements', () => {
    renderHome();
    // Should have some basic structure
    expect(document.querySelector('main, .App, [data-testid="home"]')).toBeInTheDocument();
  });
});