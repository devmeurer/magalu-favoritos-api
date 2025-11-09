import express from 'express';
import { body, validationResult } from 'express-validator';
import { ClientService } from '../services/client.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const clientService = new ClientService();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/clients/me
 * @desc Get current client information
 * @access Private
 */
router.get('/me', async (req: AuthRequest, res: express.Response) => {
  try {
    const clientId = req.clientId!;
    const client = await clientService.findById(clientId);

    if (!client) {
      return res.status(404).json({ error: { message: 'Client not found' } });
    }

    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message || 'Failed to get client' } });
  }
});

/**
 * @route GET /api/clients/:id
 * @desc Get client by ID
 * @access Private
 */
router.get('/:id', async (req: AuthRequest, res: express.Response) => {
  try {
    const clientId = parseInt(req.params.id);
    const client = await clientService.findById(clientId);

    if (!client) {
      return res.status(404).json({ error: { message: 'Client not found' } });
    }

    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message || 'Failed to get client' } });
  }
});

/**
 * @route PUT /api/clients/me
 * @desc Update current client
 * @access Private
 */
router.put(
  '/me',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', errors: errors.array() } });
      }

      const clientId = req.clientId!;
      const { name, email } = req.body;

      const updatedClient = await clientService.update(clientId, { name, email });

      res.json({
        message: 'Client updated successfully',
        client: updatedClient,
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ error: { message: error.message } });
      }
      res.status(500).json({ error: { message: error.message || 'Failed to update client' } });
    }
  }
);

/**
 * @route DELETE /api/clients/me
 * @desc Delete current client
 * @access Private
 */
router.delete('/me', async (req: AuthRequest, res: express.Response) => {
  try {
    const clientId = req.clientId!;
    const deleted = await clientService.delete(clientId);

    if (!deleted) {
      return res.status(404).json({ error: { message: 'Client not found' } });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message || 'Failed to delete client' } });
  }
});

export default router;

