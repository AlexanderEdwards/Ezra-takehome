import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders loading spinner with default props', () => {
    render(<LoadingSpinner />);
    
    // Check if the spinner element is in the document
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('h-8', 'w-8'); // Default medium size
  });

  test('has correct accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    
    // Check for screen reader text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  test('applies custom className', () => {
    render(<LoadingSpinner className="p-4" />);
    
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('flex', 'justify-center', 'items-center', 'p-4');
  });

  test('has correct styling classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-2',
      'border-gray-300',
      'border-t-primary-600'
    );
  });

  test('container has correct layout classes', () => {
    render(<LoadingSpinner />);
    
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('flex', 'justify-center', 'items-center');
  });
});
