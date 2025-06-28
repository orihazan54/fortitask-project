import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../../pages/ForgotPassword';
import * as api from '../../services/api';
import { toast } from 'sonner';

// Mock the API calls
jest.mock('../../services/api', () => ({
  sendPasswordResetEmail: jest.fn(),
  resetPassword: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const renderForgotPassword = () => {
  return render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>
  );
};

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Step 1 - Email Entry', () => {
    test('renders step 1 correctly', () => {
      renderForgotPassword();
      
      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address to reset your password.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByText('Send Reset Email')).toBeInTheDocument();
    });

    test('validates email format before sending', async () => {
      const user = userEvent.setup();
      renderForgotPassword();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const sendButton = screen.getByText('Send Reset Email');

      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(sendButton);

      expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address');
      expect(api.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    test('sends password reset email successfully', async () => {
      const user = userEvent.setup();
      api.sendPasswordResetEmail.mockResolvedValue({ success: true });
      
      renderForgotPassword();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const sendButton = screen.getByText('Send Reset Email');

      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);

      await waitFor(() => {
        expect(api.sendPasswordResetEmail).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(toast.success).toHaveBeenCalledWith('Verification code sent to your email');
      });

      // Should move to step 2
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
    });

    test('handles email sending error', async () => {
      const user = userEvent.setup();
      api.sendPasswordResetEmail.mockRejectedValue({
        response: { data: { message: 'Email not found' } }
      });
      
      renderForgotPassword();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const sendButton = screen.getByText('Send Reset Email');

      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email not found');
      });
    });

    test('shows loading state when sending email', async () => {
      const user = userEvent.setup();
      api.sendPasswordResetEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderForgotPassword();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const sendButton = screen.getByText('Send Reset Email');

      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Step 2 - Password Reset', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      api.sendPasswordResetEmail.mockResolvedValue({ success: true });
      
      renderForgotPassword();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const sendButton = screen.getByText('Send Reset Email');

      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      });
    });

    test('renders step 2 correctly', () => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter verification code')).toBeInTheDocument();
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
      expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    test('shows password requirements', () => {
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('At least one uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('At least one lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('At least one number')).toBeInTheDocument();
      expect(screen.getByText('At least one special character (!@#$%^&*)')).toBeInTheDocument();
    });

    test('toggles password visibility', async () => {
      const user = userEvent.setup();
      
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Find toggle buttons using container query
      const container = screen.getByText('Reset Your Password').closest('.card');
      const toggleButtons = container.querySelectorAll('.password-toggle');
      
      expect(toggleButtons).toHaveLength(2);
      
      // Click first toggle for new password
      await user.click(toggleButtons[0]);
      
      await waitFor(() => {
        expect(newPasswordInput).toHaveAttribute('type', 'text');
      });
    });

    test('validates password strength', async () => {
      const user = userEvent.setup();
      
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');

      // Test weak password
      await user.type(newPasswordInput, 'weak');
      expect(screen.getByText('Password Strength: Weak')).toBeInTheDocument();

      // Test medium password
      await user.clear(newPasswordInput);
      await user.type(newPasswordInput, 'Medium123');
      expect(screen.getByText('Password Strength: Medium')).toBeInTheDocument();

      // Test strong password
      await user.clear(newPasswordInput);
      await user.type(newPasswordInput, 'Strong123!');
      expect(screen.getByText('Password Strength: Strong')).toBeInTheDocument();
    });

    test('validates all fields are filled', async () => {
      const user = userEvent.setup();
      
      const resetButton = screen.getByText('Reset Password');
      await user.click(resetButton);

      expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
    });

    test('validates password match', async () => {
      const user = userEvent.setup();
      
      const verificationInput = screen.getByPlaceholderText('Enter verification code');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByText('Reset Password');

      await user.type(verificationInput, '123456');
      await user.type(newPasswordInput, 'Strong123!');
      await user.type(confirmPasswordInput, 'Different123!');
      await user.click(resetButton);

      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });

    test('rejects weak passwords', async () => {
      const user = userEvent.setup();
      
      const verificationInput = screen.getByPlaceholderText('Enter verification code');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByText('Reset Password');

      await user.type(verificationInput, '123456');
      await user.type(newPasswordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');
      await user.click(resetButton);

      expect(toast.error).toHaveBeenCalledWith('Password is too weak. Please choose a stronger password');
    });

    test('successfully resets password', async () => {
      const user = userEvent.setup();
      api.resetPassword.mockResolvedValue({ success: true });
      
      const verificationInput = screen.getByPlaceholderText('Enter verification code');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByText('Reset Password');

      await user.type(verificationInput, '123456');
      await user.type(newPasswordInput, 'Strong123!');
      await user.type(confirmPasswordInput, 'Strong123!');
      await user.click(resetButton);

      await waitFor(() => {
        expect(api.resetPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          verificationCode: '123456',
          newPassword: 'Strong123!'
        });
        expect(toast.success).toHaveBeenCalledWith('Password reset successfully');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('handles password reset error', async () => {
      const user = userEvent.setup();
      api.resetPassword.mockRejectedValue({
        response: { data: { message: 'Invalid verification code' } }
      });
      
      const verificationInput = screen.getByPlaceholderText('Enter verification code');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByText('Reset Password');

      await user.type(verificationInput, '123456');
      await user.type(newPasswordInput, 'Strong123!');
      await user.type(confirmPasswordInput, 'Strong123!');
      await user.click(resetButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid verification code');
      });
    });

    test('can go back to step 1', async () => {
      const user = userEvent.setup();
      
      const backButton = screen.getByText('Back to Email');
      await user.click(backButton);

      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    });

    test('shows loading state during password reset', async () => {
      const user = userEvent.setup();
      api.resetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const verificationInput = screen.getByPlaceholderText('Enter verification code');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByText('Reset Password');

      await user.type(verificationInput, '123456');
      await user.type(newPasswordInput, 'Strong123!');
      await user.type(confirmPasswordInput, 'Strong123!');
      await user.click(resetButton);

      expect(screen.getByText('Resetting...')).toBeInTheDocument();
      expect(verificationInput).toBeDisabled();
      expect(newPasswordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
    });
  });

  describe('Password Requirements Indicators', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      api.sendPasswordResetEmail.mockResolvedValue({ success: true });
      
      renderForgotPassword();

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const sendButton = screen.getByText('Send Reset Email');

      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      });
    });

    test('updates password requirements indicators', async () => {
      const user = userEvent.setup();
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');

      // Test different password scenarios
      await user.type(newPasswordInput, 'TestPass123!');

      // All requirements should be met
      const requirementsList = screen.getByText('Password Requirements:').nextElementSibling;
      const listItems = requirementsList.querySelectorAll('li');
      
      listItems.forEach(item => {
        expect(item).toHaveClass('met');
      });
    });
  });
}); 