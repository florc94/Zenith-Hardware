export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  rating: number;

  /**
   * Especificaciones técnicas (opcional).
   */
  specs?: Record<string, string>;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'name';
  page?: number;
  pageSize?: number;
}