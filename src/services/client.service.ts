import { query } from '../database/connection';
import { Client, ClientCreate, ClientUpdate, ClientResponse } from '../models/Client';
import bcrypt from 'bcryptjs';

export class ClientService {
  async create(clientData: ClientCreate): Promise<ClientResponse> {
    // Check if email already exists
    const existingClient = await query(
      'SELECT id FROM clients WHERE email = $1',
      [clientData.email]
    );

    if (existingClient.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(clientData.password, 10);

    // Insert client
    const result = await query(
      `INSERT INTO clients (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at, updated_at`,
      [clientData.name, clientData.email, passwordHash]
    );

    const client = result.rows[0];
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      created_at: client.created_at,
      updated_at: client.updated_at,
    };
  }

  async findById(id: number): Promise<ClientResponse | null> {
    const result = await query(
      'SELECT id, name, email, created_at, updated_at FROM clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async findByEmail(email: string): Promise<Client | null> {
    const result = await query(
      'SELECT * FROM clients WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async update(id: number, clientData: ClientUpdate): Promise<ClientResponse> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (clientData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(clientData.name);
    }

    if (clientData.email !== undefined) {
      // Check if email is already taken by another client
      const existingClient = await query(
        'SELECT id FROM clients WHERE email = $1 AND id != $2',
        [clientData.email, id]
      );

      if (existingClient.rows.length > 0) {
        throw new Error('Email already registered');
      }

      updates.push(`email = $${paramCount++}`);
      values.push(clientData.email);
    }

    if (updates.length === 0) {
      return await this.findById(id) as ClientResponse;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE clients 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, name, email, created_at, updated_at`,
      values
    );

    return result.rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM clients WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async verifyPassword(client: Client, password: string): Promise<boolean> {
    return await bcrypt.compare(password, client.password_hash);
  }
}

