import express from 'express';
import { param, validationResult } from 'express-validator';
import { FavoriteService } from '../services/favorite.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const favoriteService = new FavoriteService();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/favorites
 * @desc Get all favorite products for current client
 * @access Private
 */
router.get('/', async (req: AuthRequest, res: express.Response) => {
  try {
    const clientId = req.clientId!;
    const favorites = await favoriteService.getFavorites(clientId);

    res.json({
      count: favorites.length,
      favorites,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message || 'Failed to get favorites' } });
  }
});

/**
 * @route POST /api/favorites/:productId
 * @desc Add a product to favorites
 * @access Private
 */
router.post(
  '/:productId',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', errors: errors.array() } });
      }

      const clientId = req.clientId!;
      const productId = req.params.productId;

      const favorite = await favoriteService.addFavorite(clientId, productId);

      res.status(201).json({
        message: 'Product added to favorites',
        favorite,
      });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        return res.status(404).json({ error: { message: error.message } });
      }
      if (error.message === 'Product already in favorites') {
        return res.status(409).json({ error: { message: error.message } });
      }
      res.status(500).json({ error: { message: error.message || 'Failed to add favorite' } });
    }
  }
);

/**
 * @route DELETE /api/favorites/:productId
 * @desc Remove a product from favorites
 * @access Private
 */
router.delete(
  '/:productId',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', errors: errors.array() } });
      }

      const clientId = req.clientId!;
      const productId = req.params.productId;

      const deleted = await favoriteService.removeFavorite(clientId, productId);

      if (!deleted) {
        return res.status(404).json({ error: { message: 'Favorite product not found' } });
      }

      res.json({ message: 'Product removed from favorites' });
    } catch (error: any) {
      res.status(500).json({ error: { message: error.message || 'Failed to remove favorite' } });
    }
  }
);

export default router;

