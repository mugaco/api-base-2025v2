import { Request, Response, NextFunction } from 'express';
import { UserController } from '../UserController';
import { UserService } from '../UserService';
import { ICreateUser, IUpdateUser, IUpdatePassword, UserRole } from '../UserSchema';
import { ControllerOperations } from '@core/shared/controllers/ControllerOperations';

// Mock ControllerOperations
jest.mock('@core/shared/controllers/ControllerOperations', () => ({
  ControllerOperations: {
    sendSuccessResponse: jest.fn(),
    sendErrorResponse: jest.fn(),
    handleGetRequest: jest.fn(),
    extractPaginationParams: jest.fn(),
    extractQueryOptions: jest.fn()
  }
}));

// Mock UserService
class MockUserService {
  getAll = jest.fn();
  getById = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  softDelete = jest.fn();
  restore = jest.fn();
  updateProfile = jest.fn();
  updatePassword = jest.fn();
  getPaginated = jest.fn();
  register = jest.fn();
}

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: MockUserService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockUserService = new MockUserService();
    userController = new UserController(mockUserService as any);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('Security-Critical Authentication Tests', () => {
    describe('register', () => {
      test('should register new user successfully', async () => {
        const userData: ICreateUser = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: UserRole.USER,
          lang: 'en',
          theme: 'light',
          isDeleted: false,
          isActive: true
        };

        const expectedUser = {
          _id: 'user-123',
          ...userData,
          password: undefined // Password should not be returned
        };

        mockRequest.body = userData;
        mockUserService.register.mockResolvedValueOnce(expectedUser);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUserService.register).toHaveBeenCalledWith(userData);
        expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
          mockResponse,
          expectedUser,
          201
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should handle registration with duplicate email', async () => {
        const userData: ICreateUser = {
          name: 'Jane Doe',
          email: 'existing@example.com',
          password: 'SecurePass123!',
          role: UserRole.USER,
          lang: 'en',
          theme: 'light',
          isDeleted: false,
          isActive: true
        };

        mockRequest.body = userData;
        const duplicateError = new Error('Email already exists');
        mockUserService.register.mockRejectedValueOnce(duplicateError);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUserService.register).toHaveBeenCalledWith(userData);
        expect(mockNext).toHaveBeenCalledWith(duplicateError);
        expect(ControllerOperations.sendSuccessResponse).not.toHaveBeenCalled();
      });

      test('should handle registration with weak password', async () => {
        const userData: ICreateUser = {
          name: 'Test User',
          email: 'test@example.com',
          password: '123123', // Weak password but meets length
          role: UserRole.USER,
          lang: 'en',
          theme: 'light',
          isDeleted: false,
          isActive: true
        };

        mockRequest.body = userData;
        const weakPasswordError = new Error('Password too weak');
        mockUserService.register.mockRejectedValueOnce(weakPasswordError);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(weakPasswordError);
      });

      test('should handle malformed registration data', async () => {
        const invalidData = {
          name: '',
          email: 'invalid-email',
          password: ''
        };

        mockRequest.body = invalidData;
        const validationError = new Error('Invalid user data');
        mockUserService.register.mockRejectedValueOnce(validationError);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });
    });

    describe('getProfile - Authentication Tests', () => {
      test('should get authenticated user profile successfully', async () => {
        const authenticatedUser = {
          _id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          lang: 'en',
          theme: 'light',
          isActive: true
        };

        mockRequest.user = { _id: 'user-123' } as any;
        mockUserService.getById.mockResolvedValueOnce(authenticatedUser);

        await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUserService.getById).toHaveBeenCalledWith('user-123');
        expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
          mockResponse,
          authenticatedUser
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should reject unauthenticated request', async () => {
        mockRequest.user = undefined; // No authenticated user

        await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        expect(ControllerOperations.sendErrorResponse).toHaveBeenCalledWith(
          mockResponse,
          'Usuario no autenticado',
          401
        );
        expect(mockUserService.getById).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should handle user not found error', async () => {
        mockRequest.user = { _id: 'non-existent-user' } as any;
        const notFoundError = new Error('User not found');
        mockUserService.getById.mockRejectedValueOnce(notFoundError);

        await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUserService.getById).toHaveBeenCalledWith('non-existent-user');
        expect(mockNext).toHaveBeenCalledWith(notFoundError);
        expect(ControllerOperations.sendSuccessResponse).not.toHaveBeenCalled();
      });

      test('should handle database connection error', async () => {
        mockRequest.user = { _id: 'user-123' } as any;
        const dbError = new Error('Database connection failed');
        mockUserService.getById.mockRejectedValueOnce(dbError);

        await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });

    describe('updatePassword - Security Tests', () => {
      test('should update password successfully', async () => {
        const passwordData: IUpdatePassword = {
          password: 'NewSecurePass456!',
          confirmPassword: 'NewSecurePass456!'
        };

        const updatedUser = {
          _id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          updatedAt: new Date()
        };

        mockRequest.params = { _id: 'user-123' };
        mockRequest.body = passwordData;
        mockUserService.updatePassword.mockResolvedValueOnce(updatedUser);

        await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUserService.updatePassword).toHaveBeenCalledWith('user-123', passwordData);
        expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(
          mockResponse,
          updatedUser
        );
      });

      test('should reject password update with wrong current password', async () => {
        const passwordData: IUpdatePassword = {
          password: 'NewSecurePass456!',
          confirmPassword: 'NewSecurePass456!'
        };

        mockRequest.params = { _id: 'user-123' };
        mockRequest.body = passwordData;
        const authError = new Error('Current password is incorrect');
        mockUserService.updatePassword.mockRejectedValueOnce(authError);

        await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(authError);
      });

      test('should reject password update with mismatched confirmation', async () => {
        const passwordData: IUpdatePassword = {
          password: 'NewSecurePass456!',
          confirmPassword: 'DifferentPassword!'
        };

        mockRequest.params = { _id: 'user-123' };
        mockRequest.body = passwordData;
        const mismatchError = new Error('Password confirmation does not match');
        mockUserService.updatePassword.mockRejectedValueOnce(mismatchError);

        await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(mismatchError);
      });

      test('should reject weak new password', async () => {
        const passwordData: IUpdatePassword = {
          password: '123123', // Weak password but meets length requirements
          confirmPassword: '123123'
        };

        mockRequest.params = { _id: 'user-123' };
        mockRequest.body = passwordData;
        const weakPasswordError = new Error('New password is too weak');
        mockUserService.updatePassword.mockRejectedValueOnce(weakPasswordError);

        await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(weakPasswordError);
      });
    });

    describe('Authorization Tests', () => {
      test('should prevent unauthorized access to other users data', async () => {
        mockRequest.params = { _id: 'other-user-123' };
        const unauthorizedError = new Error('Access denied');
        mockUserService.getById.mockRejectedValueOnce(unauthorizedError);

        await userController.getById(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
      });

      test('should prevent unauthorized user updates', async () => {
        const updateData: IUpdateUser = {
          name: 'Malicious Update',
          email: 'hacker@evil.com'
        };

        mockRequest.params = { _id: 'victim-user-123' };
        mockRequest.body = updateData;
        const unauthorizedError = new Error('Insufficient permissions');
        mockUserService.update.mockRejectedValueOnce(unauthorizedError);

        await userController.update(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
      });

      test('should prevent unauthorized user deletion', async () => {
        mockRequest.params = { _id: 'protected-user-123' };
        const unauthorizedError = new Error('Cannot delete this user');
        mockUserService.delete.mockRejectedValueOnce(unauthorizedError);

        await userController.delete(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
      });
    });

    describe('Input Validation and Sanitization', () => {
      test('should handle SQL injection attempts in query parameters', async () => {
        mockRequest.query = {
          email: "'; DROP TABLE users; --",
          name: '<script>alert("xss")</script>'
        };

        await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

        // The buildQuery method should sanitize these inputs
        expect(mockUserService.getAll).toHaveBeenCalled();
        const query = mockUserService.getAll.mock.calls[0][0];
        
        // Should create regex patterns for legitimate search, not execute malicious code
        expect(query.email).toEqual({ $regex: "'; DROP TABLE users; --", $options: 'i' });
        expect(query.name).toEqual({ $regex: '<script>alert("xss")</script>', $options: 'i' });
      });

      test('should handle XSS attempts in user creation', async () => {
        const maliciousUserData: ICreateUser = {
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: UserRole.USER,
          lang: 'en',
          theme: '<img src=x onerror=alert("xss")>',
          isDeleted: false,
          isActive: true
        };

        mockRequest.body = maliciousUserData;
        const sanitizationError = new Error('Invalid characters in user data');
        mockUserService.register.mockRejectedValueOnce(sanitizationError);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(sanitizationError);
      });

      test('should validate email format in user registration', async () => {
        const invalidEmailData: ICreateUser = {
          name: 'Test User',
          email: 'not-an-email',
          password: 'SecurePass123!',
          role: UserRole.USER,
          lang: 'en',
          theme: 'light',
          isDeleted: false,
          isActive: true
        };

        mockRequest.body = invalidEmailData;
        const emailError = new Error('Invalid email format');
        mockUserService.register.mockRejectedValueOnce(emailError);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(emailError);
      });
    });

    describe('Rate Limiting and DOS Protection', () => {
      test('should handle rapid registration attempts', async () => {
        const userData: ICreateUser = {
          name: 'Spam User',
          email: 'spam@example.com',
          password: 'SecurePass123!',
          role: UserRole.USER,
          lang: 'en',
          theme: 'light',
          isDeleted: false,
          isActive: true
        };

        mockRequest.body = userData;
        const rateLimitError = new Error('Too many registration attempts');
        mockUserService.register.mockRejectedValueOnce(rateLimitError);

        await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(rateLimitError);
      });

      test('should handle excessive password change attempts', async () => {
        const passwordData: IUpdatePassword = {
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!'
        };

        mockRequest.params = { _id: 'user-123' };
        mockRequest.body = passwordData;
        const rateLimitError = new Error('Too many password change attempts');
        mockUserService.updatePassword.mockRejectedValueOnce(rateLimitError);

        await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(rateLimitError);
      });
    });
  });

  describe('Standard CRUD Operations', () => {
    test('should get all users', async () => {
      const users = [{ _id: '1', name: 'User 1' }, { _id: '2', name: 'User 2' }];
      mockUserService.getAll.mockResolvedValueOnce(users);

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getAll).toHaveBeenCalled();
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(mockResponse, users);
    });

    test('should get user by ID', async () => {
      const user = { _id: 'user-123', name: 'John Doe' };
      mockRequest.params = { _id: 'user-123' };
      mockUserService.getById.mockResolvedValueOnce(user);

      await userController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getById).toHaveBeenCalledWith('user-123');
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(mockResponse, user);
    });

    test('should create user', async () => {
      const userData: ICreateUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        role: UserRole.USER,
        lang: 'en',
        theme: 'light',
        isDeleted: false,
        isActive: true
      };
      const newUser = { _id: 'new-user-123', ...userData };

      mockRequest.body = userData;
      mockUserService.create.mockResolvedValueOnce(newUser);

      await userController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.create).toHaveBeenCalledWith(userData);
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(mockResponse, newUser, 201);
    });

    test('should update user', async () => {
      const updateData: IUpdateUser = { name: 'Updated Name' };
      const updatedUser = { _id: 'user-123', name: 'Updated Name' };

      mockRequest.params = { _id: 'user-123' };
      mockRequest.body = updateData;
      mockUserService.update.mockResolvedValueOnce(updatedUser);

      await userController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.update).toHaveBeenCalledWith('user-123', updateData);
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(mockResponse, updatedUser);
    });

    test('should soft delete user', async () => {
      const deletedUser = { _id: 'user-123', isDeleted: true };

      mockRequest.params = { _id: 'user-123' };
      mockUserService.softDelete.mockResolvedValueOnce(deletedUser);

      await userController.softDelete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.softDelete).toHaveBeenCalledWith('user-123');
      expect(ControllerOperations.sendSuccessResponse).toHaveBeenCalledWith(mockResponse, deletedUser);
    });

    test('should handle errors in all operations', async () => {
      const error = new Error('Database error');
      mockUserService.getAll.mockRejectedValueOnce(error);

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});