import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Injectable,
  inject,
  LOCALE_ID
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  map
} from 'rxjs/operators';

import {
  environment
} from '../../../../environments/environment';

import {
  Product,
  ProductFilters
} from '../models/product.model';

import {
  PagedResult
} from '../../../core/models/api-response.model';


// =====================================================
// SUGERENCIA DEL BUSCADOR (navbar)
// =====================================================

export interface SearchSuggestion {

  id: number;

  name: string;

  price: number;

  imageUrl?: string | null;

}


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly http = inject(HttpClient);

  private readonly locale =
    inject(LOCALE_ID);

  private readonly base =
    `${environment.apiUrl}/products`;

  private get currentLocale(): string {
    return this.locale.startsWith('en')
      ? 'en'
      : 'es';
  }


  // =====================================================
  // OBTENER PRODUCTOS
  // =====================================================

  getAll(
    filters: ProductFilters = {}
  ): Observable<PagedResult<Product>> {

    let params =
      new HttpParams()
        .set(
          'lang',
          this.currentLocale
        );

    if (filters.search?.trim()) {

      params = params.set(
        'search',
        filters.search.trim()
      );

    }

    if (filters.category?.trim()) {

      params = params.set(
        'category',
        filters.category.trim()
      );

    }

    if (filters.sortBy) {

      params = params.set(
        'sortBy',
        filters.sortBy
      );

    }

    if (filters.page) {

      params = params.set(
        'page',
        filters.page
      );

    }

    if (filters.pageSize) {

      params = params.set(
        'pageSize',
        filters.pageSize
      );

    }

    return this.http.get<
      PagedResult<Product>
    >(
      this.base,
      { params }
    );
  }


  // =====================================================
  // BUSCADOR EN VIVO (sugerencias del navbar)
  // =====================================================

  searchProducts(
    term: string,
    limit = 8
  ): Observable<SearchSuggestion[]> {

    return this.getAll({
      search: term,
      page: 1,
      pageSize: limit
    }).pipe(
      map(result =>
        result.items.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        }))
      )
    );
  }


  // =====================================================
  // OBTENER PRODUCTO POR ID
  // =====================================================

  getById(
    id: number
  ): Observable<Product> {

    const params =
      new HttpParams()
        .set(
          'lang',
          this.currentLocale
        );

    return this.http.get<Product>(
      `${this.base}/${id}`,
      { params }
    );
  }


  // =====================================================
  // OBTENER CATEGORÍAS
  // =====================================================

  getCategories(): Observable<string[]> {

    const params =
      new HttpParams()
        .set(
          'lang',
          this.currentLocale
        );

    return this.http.get<string[]>(
      `${this.base}/categories`,
      { params }
    );
  }


  // =====================================================
  // CREAR PRODUCTO
  // =====================================================

  create(product: {
    name: string;
    category: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;

    /*
     * Imágenes adicionales de la galería.
     */
    images: string[];

  }): Observable<Product> {

    return this.http.post<Product>(
      this.base,
      product
    );
  }


  // =====================================================
  // ACTUALIZAR PRODUCTO
  // =====================================================

  update(
    id: number,
    product: {
      name: string;
      category: string;
      description: string;
      price: number;
      stock: number;
      imageUrl: string;

      /*
       * Imágenes adicionales de la galería.
       */
      images: string[];

    }
  ): Observable<Product> {

    return this.http.put<Product>(
      `${this.base}/${id}`,
      product
    );
  }

}