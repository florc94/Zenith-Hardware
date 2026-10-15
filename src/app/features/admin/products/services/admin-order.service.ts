import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Order, OrderStatus } from '../../../orders/models/order.model';

export interface OrderResponse {
  data: Order[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  // Ahora recibe page y limit opcionales
  getAll(page: number = 1, limit: number = 10): Observable<OrderResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<OrderResponse>(this.apiUrl, { params });
  }

  updateStatus(orderId: number, status: OrderStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status });
  }
}