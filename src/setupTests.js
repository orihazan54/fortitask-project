// Comprehensive Jest testing environment configuration for academic assignment management system
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Comprehensive Axios mocking for API testing isolation
// Mock axios for all tests
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    defaults: {},
    // Mock axios instance creation for isolated testing
    create: jest.fn(() => ({
      defaults: {},
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} }))
    })),
    // Mock all HTTP methods for comprehensive API testing
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

// Browser cryptography API mock for security-related testing
// Mock window.crypto for tests
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  }
});

// Local storage mock for session management testing
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Session storage mock for temporary data testing
// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Intersection Observer API mock for component visibility testing
// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Media query matching mock for responsive design testing
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// URL object manipulation mock for file handling testing
// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// File constructor mock for upload functionality testing
// Mock File constructor
global.File = class File extends Blob {
  constructor(fileParts, fileName, options) {
    super(fileParts, options);
    this.name = fileName;
    this.lastModified = Date.now();
  }
};

// FileReader API mock for file content processing testing
// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.readyState = 0;
    this.onload = null;
    this.onerror = null;
  }
  
  // Mock data URL reading for image file testing
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,dGVzdA==';
      this.readyState = 2;
      if (this.onload) this.onload();
    }, 0);
  }
  
  // Mock text reading for document file testing
  readAsText() {
    setTimeout(() => {
      this.result = 'test content';
      this.readyState = 2;
      if (this.onload) this.onload();
    }, 0);
  }
};

// Resize observer mock for dynamic layout testing
// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Window scrolling mock for navigation testing
// Mock window.scrollTo
global.scrollTo = jest.fn();

// Console output filtering for cleaner test results
// Mock console methods to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Restore original console after testing
afterAll(() => {
  console.error = originalError;
});

// Default user authentication state for consistent testing
// Setup default user info for tests
beforeEach(() => {
  localStorageMock.getItem.mockImplementation((key) => {
    if (key === 'userInfo') {
      return JSON.stringify({
        token: 'test-token',
        userId: 'test-user-id',
        userRole: 'Student',
        userName: 'Test User'
      });
    }
    return null;
  });
});

// Comprehensive test cleanup for isolated test execution
// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
});