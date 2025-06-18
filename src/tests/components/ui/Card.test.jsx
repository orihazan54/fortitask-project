
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';

describe('Card Components', () => {
  test('Card renders with default styling', () => {
    render(<Card data-testid="card">Card content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-[rgba(30,41,59,0.7)]', 'backdrop-blur-md');
  });

  test('Card accepts custom className', () => {
    render(<Card className="custom-card" data-testid="card">Content</Card>);
    
    expect(screen.getByTestId('card')).toHaveClass('custom-card');
  });

  test('CardHeader renders correctly', () => {
    render(<CardHeader data-testid="header">Header content</CardHeader>);
    
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  test('CardTitle renders correctly', () => {
    render(<CardTitle>Title text</CardTitle>);
    
    const title = screen.getByText('Title text');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'text-white');
  });

  test('CardDescription renders correctly', () => {
    render(<CardDescription>Description text</CardDescription>);
    
    const description = screen.getByText('Description text');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('text-sm', 'text-white/80');
  });

  test('CardContent renders correctly', () => {
    render(<CardContent data-testid="content">Content text</CardContent>);
    
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  test('CardFooter renders correctly', () => {
    render(<CardFooter data-testid="footer">Footer content</CardFooter>);
    
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  test('complete card structure works together', () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('complete-card')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });
});