import { ClientService } from '../../services/client.service';
import { query } from '../../database/connection';
import bcrypt from 'bcryptjs';

// Mock database connection
jest.mock('../../database/connection');
jest.mock('bcryptjs');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('ClientService', () => {
  let clientService: ClientService;

  beforeEach(() => {
    jest.clearAllMocks();
    clientService = new ClientService();
  });

  describe('create', () => {
    it('should create a new client successfully', async () => {
      const clientData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // Email check
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          rowCount: 1,
        } as any);

      mockBcrypt.hash.mockResolvedValue('$2a$10$hashedpassword' as never);

      const result = await clientService.create(clientData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw error when email already exists', async () => {
      const clientData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      await expect(clientService.create(clientData)).rejects.toThrow('Email already registered');
    });
  });

  describe('findById', () => {
    it('should return client when found', async () => {
      const mockClient = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockClient],
        rowCount: 1,
      } as any);

      const result = await clientService.findById(1);

      expect(result).toEqual(mockClient);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, name, email, created_at, updated_at FROM clients WHERE id = $1',
        [1]
      );
    });

    it('should return null when client not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await clientService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return client when found by email', async () => {
      const mockClient = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: '$2a$10$hashed',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockClient],
        rowCount: 1,
      } as any);

      const result = await clientService.findByEmail('test@example.com');

      expect(result).toEqual(mockClient);
    });

    it('should return null when email not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await clientService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update client name successfully', async () => {
      const updateData = { name: 'Updated Name' };
      const mockUpdatedClient = {
        id: 1,
        name: 'Updated Name',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUpdatedClient],
        rowCount: 1,
      } as any);

      const result = await clientService.update(1, updateData);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error when email is already taken by another client', async () => {
      const updateData = { email: 'taken@example.com' };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 2 }],
          rowCount: 1,
        } as any) // Email check
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      await expect(clientService.update(1, updateData)).rejects.toThrow('Email already registered');
    });
  });

  describe('delete', () => {
    it('should delete client successfully', async () => {
      const mockResult = {
        rows: [],
        rowCount: 1,
      };
      mockQuery.mockResolvedValueOnce(mockResult as any);

      const result = await clientService.delete(1);

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM clients WHERE id = $1', [1]);
    });

    it('should return false when client not found', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
      };
      mockQuery.mockResolvedValueOnce(mockResult as any);

      const result = await clientService.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const mockClient = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: '$2a$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await clientService.verifyPassword(mockClient, 'password123');

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', mockClient.password_hash);
    });

    it('should return false for incorrect password', async () => {
      const mockClient = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: '$2a$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await clientService.verifyPassword(mockClient, 'wrongpassword');

      expect(result).toBe(false);
    });
  });
});

