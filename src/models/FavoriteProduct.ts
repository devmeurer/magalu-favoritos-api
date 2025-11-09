export interface FavoriteProduct {
  id: number;
  client_id: number;
  product_id: string;
  created_at: Date;
}

export interface ProductInfo {
  id: string;
  title: string;
  price: number;
  image: string;
  reviewScore?: number;
}

export interface FavoriteProductResponse {
  id: number;
  product: ProductInfo;
  created_at: Date;
}

