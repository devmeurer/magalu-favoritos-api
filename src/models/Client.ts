export interface Client {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientCreate {
  name: string;
  email: string;
  password: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string;
}

export interface ClientResponse {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

