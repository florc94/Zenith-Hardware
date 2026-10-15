import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Order, OrderStatus } from '../../../orders/models/order.model';

// Estructura exacta que responde el backend con paginación
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

  // Lista de pedidos con paginación server-side
  getAll(
    page: number = 1,
    limit: number = 10
  ): Observable<OrderResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<OrderResponse>(
      this.apiUrl,
      { params }
    );
  }

  // Obtiene un pedido individual
  getById(id: number): Observable<Order> {
    return this.http.get<Order>(
      `${this.apiUrl}/${id}`
    );
  }

  // Actualiza el estado del pedido
  updateStatus(
    orderId: number,
    status: OrderStatus
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/status`,
      { status }
    );
  }
}