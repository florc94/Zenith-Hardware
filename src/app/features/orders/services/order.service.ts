import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CartItem } from '../../cart/services/cart.service';
import { Order, OrderStatus } from '../models/order.model';

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: {
    productId: number;
    quantity: number;
  }[];
  subtotal: number;
  costoEnvio: number;
  total: number;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  data: Order[];

  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  protected readonly base =
    `${environment.apiUrl}/orders`;

  constructor(
    protected http: HttpClient
  ) {}

  // =========================================================
  // CREAR PEDIDO
  // =========================================================

  create(
    customerName: string,
    customerEmail: string,
    items: CartItem[],
    shippingAddress: string,
    subtotal: number,
    costoEnvio: number,
    total: number
  ): Observable<Order> {

    const payload: CheckoutPayload = {

      customerName,
      customerEmail,

      shippingAddress,

      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),

      subtotal,
      costoEnvio,
      total
    };

    return this.http.post<Order>(
      this.base,
      payload
    );
  }


  // =========================================================
  // PEDIDOS DEL USUARIO
  // =========================================================

  getByUser(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Observable<OrdersResponse> {

    return this.http.get<OrdersResponse>(
      this.base,
      {
        params: {
          userId: userId.toString(),
          page: page.toString(),
          limit: limit.toString()
        }
      }
    );
  }


  // =========================================================
  // TODOS LOS PEDIDOS - ADMIN
  // =========================================================

  getAllOrders(
    page: number = 1,
    limit: number = 10
  ): Observable<OrdersResponse> {

    return this.http.get<OrdersResponse>(
      this.base,
      {
        params: {
          page: page.toString(),
          limit: limit.toString()
        }
      }
    );
  }


  // =========================================================
  // DETALLE DE PEDIDO
  // =========================================================

  getById(
    id: number
  ): Observable<Order> {

    return this.http.get<Order>(
      `${this.base}/${id}`
    );
  }


  // =========================================================
  // ACTUALIZAR ESTADO
  // =========================================================

  updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus
  ): Observable<Order> {

    return this.http.patch<Order>(
      `${this.base}/${orderId}/status`,
      {
        status: newStatus
      }
    );
  }
}