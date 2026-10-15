export interface Favorite {
  id: number;
  userId?: number;
  productId: number;
  createdAt?: string;

  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating?: number;

  favoriteCreatedAt?: string;
}

export interface FavoriteCheckResponse {
  favorite: boolean;
}

export interface FavoriteActionResponse {
  message: string;
  favorite: boolean;
}