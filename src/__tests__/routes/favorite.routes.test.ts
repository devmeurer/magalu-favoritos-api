import request from 'supertest';
import express from 'express';

// Mock services and middleware BEFORE importing routes
jest.mock('../../services/favorite.service');
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.clientId = 1;
    req.email = 'test@example.com';
    next();
  }),
}));

import favoriteRoutes from '../../routes/favorite.routes';
import { FavoriteService } from '../../services/favorite.service';

// Get mocked instance
const MockedFavoriteService = FavoriteService as jest.MockedClass<typeof FavoriteService>;

const app = express();
app.use(express.json());
app.use('/api/favorites', favoriteRoutes);

describe('Favorite Routes', () => {
  let mockFavoriteServiceInstance: jest.Mocked<FavoriteService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instance
    mockFavoriteServiceInstance = {
      fetchProductInfo: jest.fn(),
      addFavorite: jest.fn(),
      removeFavorite: jest.fn(),
      getFavorites: jest.fn(),
      isFavorite: jest.fn(),
    } as any;

    MockedFavoriteService.mockImplementation(() => mockFavoriteServiceInstance as any);
  });

  describe('GET /api/favorites', () => {
    it('should return all favorites for authenticated client', async () => {
      const mockFavorites = [
        {
          id: 1,
          product: {
            id: '123',
            title: 'Test Product',
            price: 99.99,
            image: 'https://example.com/image.jpg',
          },
          created_at: new Date(),
        },
      ];

      mockFavoriteServiceInstance.getFavorites.mockResolvedValue(mockFavorites);

      const response = await request(app).get('/api/favorites');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body).toHaveProperty('favorites');
      expect(response.body.favorites).toHaveLength(1);
    });
  });

  describe('POST /api/favorites/:productId', () => {
    it('should add product to favorites successfully', async () => {
      const mockFavorite = {
        id: 1,
        product: {
          id: '123',
          title: 'Test Product',
          price: 99.99,
          image: 'https://example.com/image.jpg',
        },
        created_at: new Date(),
      };

      mockFavoriteServiceInstance.addFavorite.mockResolvedValue(mockFavorite);

      const response = await request(app).post('/api/favorites/123');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Product added to favorites');
      expect(response.body).toHaveProperty('favorite');
    });

    it('should return 404 when product not found', async () => {
      mockFavoriteServiceInstance.addFavorite.mockRejectedValue(new Error('Product not found'));

      const response = await request(app).post('/api/favorites/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toHaveProperty('message', 'Product not found');
    });

    it('should return 409 when product already in favorites', async () => {
      mockFavoriteServiceInstance.addFavorite.mockRejectedValue(new Error('Product already in favorites'));

      const response = await request(app).post('/api/favorites/123');

      expect(response.status).toBe(409);
      expect(response.body.error).toHaveProperty('message', 'Product already in favorites');
    });
  });

  describe('DELETE /api/favorites/:productId', () => {
    it('should remove product from favorites successfully', async () => {
      mockFavoriteServiceInstance.removeFavorite.mockResolvedValue(true);

      const response = await request(app).delete('/api/favorites/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Product removed from favorites');
    });

    it('should return 404 when favorite not found', async () => {
      mockFavoriteServiceInstance.removeFavorite.mockResolvedValue(false);

      const response = await request(app).delete('/api/favorites/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toHaveProperty('message', 'Favorite product not found');
    });
  });
});

