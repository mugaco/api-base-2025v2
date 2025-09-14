import { Request, Response, NextFunction } from 'express';
import { AccessController } from '../AccessController';
import { AccessService } from '../AccessService';
import { ILogin, IRefreshToken, IForgotPassword, IResetPassword } from '../AccessSchema';
import { ControllerOperations } from '@core/shared/controllers/ControllerOperations';

// Mock ControllerOperations
jest.mock('@core/shared/controllers/ControllerOperations', () => ({
  ControllerOperations: {
    sendSuccessResponse: jest.fn(),
    sendErrorResponse: jest.fn()
  }
}));

// Mock AccessService
class MockAccessService {
  login = jest.fn();
  refresh = jest.fn();
  logout = jest.fn();
  logoutAll = jest.fn();
  forgotPassword = jest.fn();
  verifyRecoveryToken = jest.fn();
  resetPassword = jest.fn();
}

describe('AccessController - Security-Critical Authentication Tests', () => {
  let accessController: AccessController;
  let mockAccessService: MockAccessService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAccessService = new MockAccessService();
    accessController = new AccessController(mockAccessService as any);

    mockRequest = {
      body: {},
      params: {},
      ip: '192.168.1.100',
      get: jest.fn(),
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
      redirect: jest.fn()
    };

    mockNext = jest.fn();

    // Mock request headers
    (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
      const headers: Record<string, string> = {
        'origin': 'https://example.com',
        'user-agent': 'Mozilla/5.0 (Test Browser)'
      };
      return headers[header] || '';
    });

    jest.clearAllMocks();
  });

  describe('Login Security Tests', () => {
    test('should login with valid credentials', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      const expectedResult = {
        accessToken: 'jwt-access-token',
        refreshToken: 'refresh-token-123',
        user: {
          _id: 'user-123',
          email: 'user@example.com',
          name: 'Test User'
        }
      };

      mockRequest.body = loginData;
      mockAccessService.login.mockResolvedValueOnce(expectedResult);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.login).toHaveBeenCalledWith(
        'user@example.com',
        'SecurePass123!',
        {
          ip_address: '192.168.1.100',
          origin: 'https://example.com',
          agent: 'Mozilla/5.0 (Test Browser)'
        }
      );
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expectedResult
      );
    });

    test('should reject login with invalid credentials', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'wrongpassword'
      };

      mockRequest.body = loginData;
      const authError = new Error('Invalid credentials');
      mockAccessService.login.mockRejectedValueOnce(authError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(ControllerOperations.sendSuccessResponse).not.toHaveBeenCalled();
    });

    test('should reject login with non-existent email', async () => {
      const loginData: ILogin = {
        email: 'nonexistent@example.com',
        password: 'anypassword'
      };

      mockRequest.body = loginData;
      const notFoundError = new Error('User not found');
      mockAccessService.login.mockRejectedValueOnce(notFoundError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    test('should handle SQL injection attempts in email field', async () => {
      const maliciousLogin: ILogin = {
        email: "' OR '1'='1' --",
        password: 'password'
      };

      mockRequest.body = maliciousLogin;
      const injectionError = new Error('Invalid email format');
      mockAccessService.login.mockRejectedValueOnce(injectionError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(injectionError);
    });

    test('should handle empty/null credentials', async () => {
      const emptyLogin: ILogin = {
        email: '',
        password: ''
      };

      mockRequest.body = emptyLogin;
      const validationError = new Error('Email and password are required');
      mockAccessService.login.mockRejectedValueOnce(validationError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    test('should track login attempt metadata', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      mockRequest.body = loginData;
      (mockRequest as any).ip = '203.0.113.195'; // Different IP
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'origin') return 'https://malicious-site.com';
        if (header === 'user-agent') return 'Suspicious Bot/1.0';
        return '';
      });

      mockAccessService.login.mockResolvedValueOnce({ accessToken: 'token' });

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.login).toHaveBeenCalledWith(
        'user@example.com',
        'SecurePass123!',
        {
          ip_address: '203.0.113.195',
          origin: 'https://malicious-site.com',
          agent: 'Suspicious Bot/1.0'
        }
      );
    });

    test('should handle rate limiting errors', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      mockRequest.body = loginData;
      const rateLimitError = new Error('Too many login attempts');
      mockAccessService.login.mockRejectedValueOnce(rateLimitError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(rateLimitError);
    });
  });

  describe('Token Refresh Security Tests', () => {
    test('should refresh tokens with valid refresh token', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      mockRequest.body = refreshData;
      mockAccessService.refresh.mockResolvedValueOnce(expectedResult);

      await accessController.refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.refresh).toHaveBeenCalledWith({
        refreshToken: 'valid-refresh-token',
        ip_address: '192.168.1.100',
        origin: 'https://example.com',
        agent: 'Mozilla/5.0 (Test Browser)'
      });
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expectedResult
      );
    });

    test('should reject refresh with invalid token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      mockRequest.body = refreshData;
      const invalidTokenError = new Error('Invalid refresh token');
      mockAccessService.refresh.mockRejectedValueOnce(invalidTokenError);

      await accessController.refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(invalidTokenError);
    });

    test('should reject refresh with expired token', async () => {
      const refreshData = {
        refreshToken: 'expired-refresh-token'
      };

      mockRequest.body = refreshData;
      const expiredTokenError = new Error('Refresh token expired');
      mockAccessService.refresh.mockRejectedValueOnce(expiredTokenError);

      await accessController.refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expiredTokenError);
    });

    test('should reject refresh with revoked token', async () => {
      const refreshData = {
        refreshToken: 'revoked-refresh-token'
      };

      mockRequest.body = refreshData;
      const revokedTokenError = new Error('Refresh token revoked');
      mockAccessService.refresh.mockRejectedValueOnce(revokedTokenError);

      await accessController.refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(revokedTokenError);
    });

    test('should detect token replay attacks', async () => {
      const refreshData = {
        refreshToken: 'reused-refresh-token'
      };

      mockRequest.body = refreshData;
      const replayError = new Error('Token replay detected');
      mockAccessService.refresh.mockRejectedValueOnce(replayError);

      await accessController.refresh(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(replayError);
    });
  });

  describe('Logout Security Tests', () => {
    test('should logout successfully with valid refresh token', async () => {
      const logoutData = {
        refreshToken: 'valid-refresh-token'
      };

      mockRequest.body = logoutData;
      mockAccessService.logout.mockResolvedValueOnce(undefined);

      await accessController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.logout).toHaveBeenCalledWith('valid-refresh-token');
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { message: 'Sesión cerrada correctamente' }
      );
    });

    test('should reject logout without refresh token', async () => {
      mockRequest.body = {}; // No refresh token

      await accessController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ControllerOperations.sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'No se proporcionó token de refresco',
        400
      );
      expect(mockAccessService.logout).not.toHaveBeenCalled();
    });

    test('should handle invalid refresh token in logout', async () => {
      const logoutData = {
        refreshToken: 'invalid-token'
      };

      mockRequest.body = logoutData;
      const invalidTokenError = new Error('Invalid refresh token');
      mockAccessService.logout.mockRejectedValueOnce(invalidTokenError);

      await accessController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(invalidTokenError);
    });

    test('should logout all sessions for authenticated user', async () => {
      mockRequest.user = { _id: 'user-123' } as any;
      mockAccessService.logoutAll.mockResolvedValueOnce(undefined);

      await accessController.logoutAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.logoutAll).toHaveBeenCalledWith('user-123');
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        { message: 'Todas las sesiones cerradas correctamente' }
      );
    });

    test('should reject logoutAll for unauthenticated user', async () => {
      mockRequest.user = undefined; // No authenticated user

      await accessController.logoutAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ControllerOperations.sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Usuario no autenticado',
        401
      );
      expect(mockAccessService.logoutAll).not.toHaveBeenCalled();
    });
  });

  describe('Password Recovery Security Tests', () => {
    test('should initiate password recovery successfully', async () => {
      const forgotPasswordData: IForgotPassword = {
        email: 'user@example.com',
        redirect_url: 'https://app.example.com/reset-password'
      };

      const expectedResult = {
        message: 'Recovery email sent successfully',
        resetTokenExpiration: new Date(Date.now() + 3600000) // 1 hour
      };

      mockRequest.body = forgotPasswordData;
      mockAccessService.forgotPassword.mockResolvedValueOnce(expectedResult);

      await accessController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.forgotPassword).toHaveBeenCalledWith(forgotPasswordData);
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expectedResult
      );
    });

    test('should handle forgot password for non-existent email', async () => {
      const forgotPasswordData: IForgotPassword = {
        email: 'nonexistent@example.com',
        redirect_url: 'https://app.example.com/reset-password'
      };

      mockRequest.body = forgotPasswordData;
      // Should not reveal if email exists - return success regardless
      const expectedResult = {
        message: 'If the email exists, a recovery link has been sent'
      };
      mockAccessService.forgotPassword.mockResolvedValueOnce(expectedResult);

      await accessController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.forgotPassword).toHaveBeenCalledWith(forgotPasswordData);
    });

    test('should verify recovery token successfully', async () => {
      const token = 'valid-recovery-token';
      const redirectUrl = 'https://app.example.com/reset-password?token=secondary-token';

      mockRequest.params = { token };
      mockAccessService.verifyRecoveryToken.mockResolvedValueOnce(redirectUrl);

      await accessController.verifyRecoveryToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.verifyRecoveryToken).toHaveBeenCalledWith(token);
      expect(mockResponse.redirect).toHaveBeenCalledWith(redirectUrl);
    });

    test('should handle invalid recovery token', async () => {
      const token = 'invalid-recovery-token';

      mockRequest.params = { token };
      const invalidTokenError = new Error('Invalid recovery token');
      mockAccessService.verifyRecoveryToken.mockRejectedValueOnce(invalidTokenError);

      // Mock environment variable
      process.env.ERROR_REDIRECT_URL = 'https://app.example.com/error';

      await accessController.verifyRecoveryToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://app.example.com/error?error=invalid_token'
      );
    });

    test('should handle missing recovery token', async () => {
      mockRequest.params = {}; // No token

      await accessController.verifyRecoveryToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ControllerOperations.sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Token no proporcionado',
        400
      );
    });

    test('should handle expired recovery token', async () => {
      const token = 'expired-recovery-token';

      mockRequest.params = { token };
      const expiredTokenError = new Error('Recovery token expired');
      mockAccessService.verifyRecoveryToken.mockRejectedValueOnce(expiredTokenError);

      await accessController.verifyRecoveryToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith('/error?error=invalid_token');
    });

    test('should reset password successfully', async () => {
      const resetPasswordData: IResetPassword = {
        token: 'valid-reset-token',
        password: 'NewSecurePass123!',
        password_confirm: 'NewSecurePass123!'
      };

      const expectedResult = {
        message: 'Password reset successfully',
        user: { _id: 'user-123', email: 'user@example.com' }
      };

      mockRequest.body = resetPasswordData;
      mockAccessService.resetPassword.mockResolvedValueOnce(expectedResult);

      await accessController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.resetPassword).toHaveBeenCalledWith(resetPasswordData);
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        expectedResult
      );
    });

    test('should reject password reset with weak password', async () => {
      const resetPasswordData: IResetPassword = {
        token: 'valid-reset-token',
        password: '123', // Weak password
        password_confirm: '123'
      };

      mockRequest.body = resetPasswordData;
      const weakPasswordError = new Error('Password does not meet security requirements');
      mockAccessService.resetPassword.mockRejectedValueOnce(weakPasswordError);

      await accessController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(weakPasswordError);
    });

    test('should reject password reset with mismatched passwords', async () => {
      const resetPasswordData: IResetPassword = {
        token: 'valid-reset-token',
        password: 'NewSecurePass123!',
        password_confirm: 'DifferentPassword!'
      };

      mockRequest.body = resetPasswordData;
      const mismatchError = new Error('Password confirmation does not match');
      mockAccessService.resetPassword.mockRejectedValueOnce(mismatchError);

      await accessController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mismatchError);
    });

    test('should reject password reset with invalid token', async () => {
      const resetPasswordData: IResetPassword = {
        token: 'invalid-reset-token',
        password: 'NewSecurePass123!',
        password_confirm: 'NewSecurePass123!'
      };

      mockRequest.body = resetPasswordData;
      const invalidTokenError = new Error('Invalid or expired reset token');
      mockAccessService.resetPassword.mockRejectedValueOnce(invalidTokenError);

      await accessController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(invalidTokenError);
    });
  });

  describe('Security Headers and CSRF Protection', () => {
    test('should capture all security-relevant headers', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      mockRequest.body = loginData;
      (mockRequest as any).ip = '10.0.0.1';
      
      // Mock additional security headers
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        const headers: Record<string, string> = {
          'origin': 'https://trusted-domain.com',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'referer': 'https://trusted-domain.com/login',
          'x-forwarded-for': '203.0.113.1, 10.0.0.1',
          'x-real-ip': '203.0.113.1'
        };
        return headers[header] || '';
      });

      mockAccessService.login.mockResolvedValueOnce({ accessToken: 'token' });

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.login).toHaveBeenCalledWith(
        'user@example.com',
        'SecurePass123!',
        {
          ip_address: '10.0.0.1',
          origin: 'https://trusted-domain.com',
          agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      );
    });

    test('should handle missing security headers gracefully', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      mockRequest.body = loginData;
      (mockRequest as any).ip = undefined;
      
      // Mock missing headers
      (mockRequest.get as jest.Mock).mockReturnValue('');

      mockAccessService.login.mockResolvedValueOnce({ accessToken: 'token' });

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAccessService.login).toHaveBeenCalledWith(
        'user@example.com',
        'SecurePass123!',
        {
          ip_address: undefined,
          origin: '',
          agent: ''
        }
      );
    });
  });

  describe('Brute Force Protection', () => {
    test('should handle account lockout scenarios', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'wrongpassword'
      };

      mockRequest.body = loginData;
      const lockoutError = new Error('Account temporarily locked due to multiple failed attempts');
      mockAccessService.login.mockRejectedValueOnce(lockoutError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(lockoutError);
    });

    test('should handle IP-based rate limiting', async () => {
      const loginData: ILogin = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      mockRequest.body = loginData;
      const ipRateLimitError = new Error('Too many requests from this IP address');
      mockAccessService.login.mockRejectedValueOnce(ipRateLimitError);

      await accessController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(ipRateLimitError);
    });
  });
});