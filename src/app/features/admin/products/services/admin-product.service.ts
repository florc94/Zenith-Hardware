import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../catalog/models/product.model';
import { ProductFormValue } from '../schemas/product.schema';

/**
 * Las lecturas paginadas del catálogo ya viven en ProductService
 * (features/catalog) — el admin las reusa tal cual. Este servicio suma
 * únicamente las operaciones de escritura, que sólo tienen sentido en
 * el contexto de administración.
 */
@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;

  create(value: ProductFormValue): Observable<Product> {
    return this.http.post<Product>(this.base, value);
  }

  update(id: number, value: ProductFormValue): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, value);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
