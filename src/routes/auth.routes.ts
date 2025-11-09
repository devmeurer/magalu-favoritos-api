import express from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { ClientService } from '../services/client.service';

const router = express.Router();
const authService = new AuthService();
const clientService = new ClientService();

/**
 * @route POST /api/auth/register
 * @desc Register a new client
 * @access Public
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', errors: errors.array() } });
      }

      const { name, email, password } = req.body;
      const client = await clientService.create({ name, email, password });

      res.status(201).json({
        message: 'Client created successfully',
        client,
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ error: { message: error.message } });
      }
      res.status(500).json({ error: { message: error.message || 'Failed to create client' } });
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login client and get token
 * @access Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', errors: errors.array() } });
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.json({
        message: 'Login successful',
        token: result.token,
        client: result.client,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: { message: error.message } });
      }
      res.status(500).json({ error: { message: error.message || 'Login failed' } });
    }
  }
);

export default router;

