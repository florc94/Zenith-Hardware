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
  environment
} from '../../../../environments/environment';

import {
  Favorite,
  FavoriteCheckResponse,
  FavoriteActionResponse
} from '../models/favorite.model';


@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  private readonly http = inject(HttpClient);

  private readonly locale =
    inject(LOCALE_ID);

  private readonly base =
    `${environment.apiUrl}/favorites`;


  // =====================================================
  // IDIOMA ACTUAL
  // =====================================================

  private get currentLocale(): string {

    return this.locale.startsWith('en')
      ? 'en'
      : 'es';

  }


  // =====================================================
  // OBTENER FAVORITOS
  // =====================================================

  getAll(): Observable<Favorite[]> {

    const params =
      new HttpParams()
        .set(
          'lang',
          this.currentLocale
        );

    return this.http.get<Favorite[]>(
      this.base,
      { params }
    );

  }


  // =====================================================
  // VERIFICAR FAVORITO
  // =====================================================

  isFavorite(
    productId: number
  ): Observable<FavoriteCheckResponse> {

    return this.http.get<FavoriteCheckResponse>(
      `${this.base}/check/${productId}`
    );

  }


  // =====================================================
  // AGREGAR FAVORITO
  // =====================================================

  add(
    productId: number
  ): Observable<FavoriteActionResponse> {

    return this.http.post<FavoriteActionResponse>(
      `${this.base}/${productId}`,
      {}
    );

  }


  // =====================================================
  // ELIMINAR FAVORITO
  // =====================================================

  remove(
    productId: number
  ): Observable<FavoriteActionResponse> {

    return this.http.delete<FavoriteActionResponse>(
      `${this.base}/${productId}`
    );

  }


  // =====================================================
  // TOGGLE
  // =====================================================

  toggle(
    productId: number,
    favorite: boolean
  ): Observable<FavoriteActionResponse> {

    return favorite
      ? this.remove(productId)
      : this.add(productId);

  }

}