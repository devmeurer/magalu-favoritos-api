import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export interface AuthRequest extends Request {
  clientId?: number;
  email?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    req.clientId = payload.clientId;
    req.email = payload.email;

    next();
  } catch (error: any) {
    return res.status(401).json({ error: { message: error.message || 'Invalid token' } });
  }
};

