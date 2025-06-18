// Mock crypto-js to avoid Node environment issues
jest.mock('crypto-js', () => {
  const mockEncrypt = (value) => ({
    toString: () => Buffer.from(value).toString('base64')
  });
  const mockDecrypt = (cipher) => ({
    toString: () => Buffer.from(cipher, 'base64').toString('utf8')
  });
  return {
    AES: {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt
    },
    enc: {
      Utf8: 'utf8'
    }
  };
});

import { encryptData, decryptData, checkAuthentication } from '../../services/api';

describe('API Utility Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('encryptData and decryptData are symmetrical', () => {
    const plainText = 'Hello Fortitask!';

    const cipherText = encryptData(plainText);
    expect(cipherText).not.toBe(plainText); // should be encrypted

    const decrypted = decryptData(cipherText);
    expect(decrypted).toBe(plainText); // should return original
  });

  test('checkAuthentication returns authenticated state when data exists', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('role', 'Teacher');

    const { isAuthenticated, userId, role } = checkAuthentication();

    expect(isAuthenticated).toBe(true);
    expect(userId).toBe('user123');
    expect(role).toBe('Teacher');
  });

  test('checkAuthentication returns unauthenticated when data missing', () => {
    const result = checkAuthentication();
    expect(result).toEqual({ isAuthenticated: false, userId: null, role: null });
  });
}); 