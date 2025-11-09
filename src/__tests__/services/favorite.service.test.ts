import { FavoriteService } from '../../services/favorite.service';
import { query } from '../../database/connection';
import axios from 'axios';

// Mock dependencies
jest.mock('../../database/connection');
jest.mock('axios');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('FavoriteService', () => {
  let favoriteService: FavoriteService;

  beforeEach(() => {
    jest.clearAllMocks();
    favoriteService = new FavoriteService();
  });

  describe('fetchProductInfo', () => {
    it('should fetch product information successfully', async () => {
      const mockProduct = {
        id: '123',
        title: 'Test Product',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        reviewScore: 4.5,
      };

      mockAxios.get.mockResolvedValueOnce({
        data: mockProduct,
      } as any);

      const result = await favoriteService.fetchProductInfo('123');

      expect(result).toEqual({
        id: '123',
        title: 'Test Product',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        reviewScore: 4.5,
      });
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/123/'),
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it('should throw error when product not found', async () => {
      mockAxios.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      await expect(favoriteService.fetchProductInfo('999')).rejects.toThrow('Product not found');
    });

    it('should throw error when API request fails', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(favoriteService.fetchProductInfo('123')).rejects.toThrow(
        'Failed to fetch product information'
      );
    });
  });

  describe('addFavorite', () => {
    it('should add product to favorites successfully', async () => {
      const mockProduct = {
        id: '123',
        title: 'Test Product',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        reviewScore: 4.5,
      };

      mockAxios.get.mockResolvedValueOnce({
        data: mockProduct,
      } as any);

      mockQuery
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any) // Check existing
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              client_id: 1,
              product_id: '123',
              created_at: new Date(),
            },
          ],
          rowCount: 1,
        } as any); // Insert

      const result = await favoriteService.addFavorite(1, '123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('created_at');
      expect(result.product.id).toBe('123');
    });

    it('should throw error when product already in favorites', async () => {
      const mockProduct = {
        id: '123',
        title: 'Test Product',
        price: 99.99,
        image: 'https://example.com/image.jpg',
      };

      mockAxios.get.mockResolvedValueOnce({
        data: mockProduct,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      await expect(favoriteService.addFavorite(1, '123')).rejects.toThrow(
        'Product already in favorites'
      );
    });

    it('should throw error when product not found', async () => {
      mockAxios.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      await expect(favoriteService.addFavorite(1, '999')).rejects.toThrow('Product not found');
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      } as any);

      const result = await favoriteService.removeFavorite(1, '123');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM favorite_products WHERE client_id = $1 AND product_id = $2',
        [1, '123']
      );
    });

    it('should return false when favorite not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await favoriteService.removeFavorite(1, '999');

      expect(result).toBe(false);
    });
  });

  describe('getFavorites', () => {
    it('should return all favorites with product info', async () => {
      const mockProduct = {
        id: '123',
        title: 'Test Product',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        reviewScore: 4.5,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            product_id: '123',
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      mockAxios.get.mockResolvedValueOnce({
        data: mockProduct,
      } as any);

      const result = await favoriteService.getFavorites(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('product');
      expect(result[0]).toHaveProperty('created_at');
      expect(result[0].product.id).toBe('123');
    });

    it('should handle products that no longer exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            product_id: '999',
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      mockAxios.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await favoriteService.getFavorites(1);

      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe('999');
      expect(result[0].product.title).toBe('Product not available');
    });
  });

  describe('isFavorite', () => {
    it('should return true when product is in favorites', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      const result = await favoriteService.isFavorite(1, '123');

      expect(result).toBe(true);
    });

    it('should return false when product is not in favorites', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await favoriteService.isFavorite(1, '999');

      expect(result).toBe(false);
    });
  });
});

