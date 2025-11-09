import { query } from '../database/connection';
import { FavoriteProduct, FavoriteProductResponse, ProductInfo } from '../models/FavoriteProduct';
import axios from 'axios';
import https from 'https';

const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL || 'https://challenge-api.luizalabs.com/api/product';

export class FavoriteService {
  /**
   * Fetch product information from external API
   */
  async fetchProductInfo(productId: string): Promise<ProductInfo> {
    try {
      // Tenta com e sem barra final
      let response;
      try {
        response = await axios.get(`${PRODUCTS_API_URL}/${productId}/`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
          validateStatus: (status) => status < 500, // Não lançar erro para 4xx
        });
        
        // Se retornar HTML (erro), tenta sem barra final
        if (response.headers['content-type']?.includes('text/html')) {
          response = await axios.get(`${PRODUCTS_API_URL}/${productId}`, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
            }),
            validateStatus: (status) => status < 500,
          });
        }
      } catch (err: any) {
        // Se falhar, tenta sem barra final
        if (err.response?.status === 404 || err.message?.includes('Cannot GET')) {
          response = await axios.get(`${PRODUCTS_API_URL}/${productId}`, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
            }),
            validateStatus: (status) => status < 500,
          });
        } else {
          throw err;
        }
      }

      // Verifica se a resposta é HTML (erro) ou se status é 404
      if (response.headers['content-type']?.includes('text/html') || response.status === 404) {
        throw new Error('Product not found');
      }

      const product = response.data;
      
      // Valida se os dados do produto estão presentes
      if (!product || !product.id) {
        throw new Error('Product not found');
      }
      
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        reviewScore: product.reviewScore,
      };
    } catch (error: any) {
      if (error.response?.status === 404 || error.message === 'Product not found') {
        throw new Error('Product not found');
      }
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Timeout ao buscar informações do produto. Tente novamente.');
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Não foi possível conectar à API de produtos. Verifique sua conexão.');
      }
      throw new Error(`Failed to fetch product information: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Add a product to client's favorites
   */
  async addFavorite(clientId: number, productId: string): Promise<FavoriteProductResponse> {
    // Verify product exists
    const productInfo = await this.fetchProductInfo(productId);

    // Check if product is already in favorites
    const existing = await query(
      'SELECT id FROM favorite_products WHERE client_id = $1 AND product_id = $2',
      [clientId, productId]
    );

    if (existing.rows.length > 0) {
      throw new Error('Product already in favorites');
    }

    // Add to favorites
    const result = await query(
      `INSERT INTO favorite_products (client_id, product_id) 
       VALUES ($1, $2) 
       RETURNING id, client_id, product_id, created_at`,
      [clientId, productId]
    );

    return {
      id: result.rows[0].id,
      product: productInfo,
      created_at: result.rows[0].created_at,
    };
  }

  /**
   * Remove a product from client's favorites
   */
  async removeFavorite(clientId: number, productId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM favorite_products WHERE client_id = $1 AND product_id = $2',
      [clientId, productId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get all favorite products for a client
   */
  async getFavorites(clientId: number): Promise<FavoriteProductResponse[]> {
    const result = await query(
      `SELECT id, product_id, created_at 
       FROM favorite_products 
       WHERE client_id = $1 
       ORDER BY created_at DESC`,
      [clientId]
    );

    // Fetch product info for each favorite
    const favorites = await Promise.all(
      result.rows.map(async (row) => {
        try {
          const productInfo = await this.fetchProductInfo(row.product_id);
          return {
            id: row.id,
            product: productInfo,
            created_at: row.created_at,
          };
        } catch (error) {
          // If product no longer exists, return basic info
          return {
            id: row.id,
            product: {
              id: row.product_id,
              title: 'Product not available',
              price: 0,
              image: '',
            },
            created_at: row.created_at,
          };
        }
      })
    );

    return favorites;
  }

  /**
   * Check if a product is in client's favorites
   */
  async isFavorite(clientId: number, productId: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM favorite_products WHERE client_id = $1 AND product_id = $2',
      [clientId, productId]
    );

    return result.rows.length > 0;
  }
}

