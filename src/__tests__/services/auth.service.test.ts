import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/Client';

// Mock ClientService
jest.mock('../../services/client.service');

describe('AuthService', () => {
  let authService: AuthService;
  let mockClientService: jest.Mocked<ClientService>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockClientService = authService['clientService'] as jest.Mocked<ClientService>;
  });

  describe('login', () => {
    it('should return token and client data on successful login', async () => {
      const mockClient: Client = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: '$2a$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClientService.findByEmail.mockResolvedValue(mockClient);
      mockClientService.verifyPassword.mockResolvedValue(true);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('client');
      expect(result.client.id).toBe(1);
      expect(result.client.email).toBe('test@example.com');
      expect(result.client.name).toBe('Test User');
      expect(mockClientService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockClientService.verifyPassword).toHaveBeenCalledWith(mockClient, 'password123');
    });

    it('should throw error when client does not exist', async () => {
      mockClientService.findByEmail.mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error when password is incorrect', async () => {
      const mockClient: Client = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: '$2a$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClientService.findByEmail.mockResolvedValue(mockClient);
      mockClientService.verifyPassword.mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        clientId: 1,
        email: 'test@example.com',
      };

      const token = authService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload from valid token', () => {
      const payload = {
        clientId: 1,
        email: 'test@example.com',
      };

      const token = authService.generateToken(payload);
      const verified = authService.verifyToken(token);

      expect(verified.clientId).toBe(1);
      expect(verified.email).toBe('test@example.com');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Create a token with very short expiration
      const originalExpiresIn = process.env.JWT_EXPIRES_IN;
      process.env.JWT_EXPIRES_IN = '-1s'; // Already expired
      
      const payload = {
        clientId: 1,
        email: 'test@example.com',
      };

      const token = authService.generateToken(payload);
      
      // Restore original value
      process.env.JWT_EXPIRES_IN = originalExpiresIn;

      // Try to verify the expired token
      expect(() => {
        authService.verifyToken(token);
      }).toThrow('Invalid or expired token');
    });
  });
});

