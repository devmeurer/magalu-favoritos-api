import request from 'supertest';
import express from 'express';

// Mock services BEFORE importing routes
jest.mock('../../services/auth.service');
jest.mock('../../services/client.service');

import authRoutes from '../../routes/auth.routes';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';

// Get mocked instances
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const MockedClientService = ClientService as jest.MockedClass<typeof ClientService>;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let mockAuthServiceInstance: jest.Mocked<AuthService>;
  let mockClientServiceInstance: jest.Mocked<ClientService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockAuthServiceInstance = {
      login: jest.fn(),
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    mockClientServiceInstance = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      verifyPassword: jest.fn(),
    } as any;

    MockedAuthService.mockImplementation(() => mockAuthServiceInstance as any);
    MockedClientService.mockImplementation(() => mockClientServiceInstance as any);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new client successfully', async () => {
      const mockClient = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClientServiceInstance.create.mockResolvedValue(mockClient);

      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Client created successfully');
      expect(response.body).toHaveProperty('client');
      expect(response.body.client.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Validation failed');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Validation failed');
    });

    it('should return 409 for duplicate email', async () => {
      mockClientServiceInstance.create.mockRejectedValue(new Error('Email already registered'));

      const response = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toHaveProperty('message', 'Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return token', async () => {
      mockAuthServiceInstance.login.mockResolvedValue({
        token: 'mock-jwt-token',
        client: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('client');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Validation failed');
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthServiceInstance.login.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('message', 'Invalid credentials');
    });
  });
});

