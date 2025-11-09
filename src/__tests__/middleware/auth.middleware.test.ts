import { Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';

// Mock AuthService
jest.mock('../../services/auth.service');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  it('should authenticate request with valid token', async () => {
    const mockPayload = {
      clientId: 1,
      email: 'test@example.com',
    };

    const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
    const mockInstance = {
      verifyToken: jest.fn().mockReturnValue(mockPayload),
    };
    mockAuthService.mockImplementation(() => mockInstance as any);

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockRequest.clientId).toBe(1);
    expect(mockRequest.email).toBe('test@example.com');
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is missing', async () => {
    mockRequest.headers = {};

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: { message: 'Authentication required' },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', async () => {
    mockRequest.headers = {
      authorization: 'Invalid token',
    };

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: { message: 'Authentication required' },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
    const mockInstance = {
      verifyToken: jest.fn().mockImplementation(() => {
        throw new Error('Invalid or expired token');
      }),
    };
    mockAuthService.mockImplementation(() => mockInstance as any);

    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: { message: 'Invalid or expired token' },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

