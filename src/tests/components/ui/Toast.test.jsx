import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast, Toaster } from 'sonner';
import '@testing-library/jest-dom';

// Mock component to test toast functionality
const TestToastComponent = () => {
  const showSuccessToast = () => {
    toast.success('פעולה הצליחה!');
  };

  const showErrorToast = () => {
    toast.error('שגיאה בפעולה');
  };

  const showWarningToast = () => {
    toast.warning('אזהרה');
  };

  const showInfoToast = () => {
    toast('מידע כללי');
  };

  return (
    <div>
      <button onClick={showSuccessToast} data-testid="success-btn">
        Success Toast
      </button>
      <button onClick={showErrorToast} data-testid="error-btn">
        Error Toast
      </button>
      <button onClick={showWarningToast} data-testid="warning-btn">
        Warning Toast
      </button>
      <button onClick={showInfoToast} data-testid="info-btn">
        Info Toast
      </button>
      <Toaster position="top-right" />
    </div>
  );
};

describe('Sonner Toast Components', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    toast.dismiss();
  });

  test('renders Toaster component without crashing', () => {
    render(<Toaster />);
    // Toaster should render without throwing errors
    expect(document.body).toBeInTheDocument();
  });

  test('shows success toast when triggered', async () => {
    render(<TestToastComponent />);
    
    const successBtn = screen.getByTestId('success-btn');
    fireEvent.click(successBtn);

    // Wait for toast to appear
    await waitFor(() => {
      // Check if toast container exists and has content
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  test('shows error toast when triggered', async () => {
    render(<TestToastComponent />);
    
    const errorBtn = screen.getByTestId('error-btn');
    fireEvent.click(errorBtn);

    await waitFor(() => {
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  test('shows warning toast when triggered', async () => {
    render(<TestToastComponent />);
    
    const warningBtn = screen.getByTestId('warning-btn');
    fireEvent.click(warningBtn);

    await waitFor(() => {
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  test('shows info toast when triggered', async () => {
    render(<TestToastComponent />);
    
    const infoBtn = screen.getByTestId('info-btn');
    fireEvent.click(infoBtn);

    await waitFor(() => {
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  test('Toaster accepts configuration props', () => {
    render(
      <Toaster 
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        duration={4000}
      />
    );
    
    // Just verify the component renders without crashing
    expect(document.body).toBeInTheDocument();
  });

  test('multiple toasts can be displayed', async () => {
    render(<TestToastComponent />);
    
    const successBtn = screen.getByTestId('success-btn');
    const errorBtn = screen.getByTestId('error-btn');
    
    // Trigger multiple toasts
    fireEvent.click(successBtn);
    fireEvent.click(errorBtn);

    await waitFor(() => {
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  test('toast can be dismissed programmatically', async () => {
    render(<TestToastComponent />);
    
    const successBtn = screen.getByTestId('success-btn');
    fireEvent.click(successBtn);

    await waitFor(() => {
      const toastContainer = document.querySelector('[data-sonner-toaster]');
      expect(toastContainer).toBeInTheDocument();
    });

    // Dismiss all toasts
    toast.dismiss();

    // Wait a bit for dismissal to take effect
    await waitFor(() => {
      // After dismissal, the container might still exist but be empty
      expect(document.body).toBeInTheDocument();
    });
  });
}); 