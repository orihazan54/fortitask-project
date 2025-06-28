// Comprehensive backend testing environment configuration for academic assignment management system
// Global setup for backend Jest tests
// Ensure environment variables and mocks are in place
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.CLOUDINARY_URL = 'cloudinary://test:test@cloudinary';
process.env.SMTP_USER = 'smtp_user';
process.env.SMTP_PASS = 'smtp_pass';

// Clean console output by filtering expected validation error messages
// Disable console.error spam for expected validation errors
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Restore original console functionality after testing
afterAll(() => {
  console.error.mockRestore();
}); 