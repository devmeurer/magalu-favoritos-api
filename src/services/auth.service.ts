import jwt from 'jsonwebtoken';
import { ClientService } from './client.service';
import { Client } from '../models/Client';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  clientId: number;
  email: string;
}

export class AuthService {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  async login(email: string, password: string): Promise<{ token: string; client: any }> {
    const client = await this.clientService.findByEmail(email);

    if (!client) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.clientService.verifyPassword(client, password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({
      clientId: client.id,
      email: client.email,
    });

    return {
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
    };
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

