import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { OrderStatus } from '../../../orders/models/order.model';


// ============================================================
// PRODUCTO MÁS VENDIDO
// ============================================================

export interface TopProduct {
  productId: number;
  name: string;
  quantity: number;
  revenue: number;
}


// ============================================================
// PERÍODOS DE VENTAS
// ============================================================

export type SalesPeriod =
  | '7d'
  | '30d'
  | '3m'
  | '12m';


// ============================================================
// PUNTO DEL GRÁFICO
// ============================================================

export interface SalesPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}


// ============================================================
// RESPUESTA DE VENTAS POR PERÍODO
// ============================================================

export interface SalesByPeriod {
  period: SalesPeriod;
  totalRevenue: number;
  totalOrders: number;
  points: SalesPoint[];
}


// ============================================================
// MÉTRICAS GENERALES DEL DASHBOARD
// ============================================================

export interface DashboardMetrics {
  totalRevenue: number;
  thisMonthRevenue: number;
  avgOrderValue: number;
  avgDeliveryTimeHours: number;

  ordersByStatus:
    Record<OrderStatus, number>;

  topProducts: TopProduct[];

  totalOrders: number;

  salesByPeriod: SalesPoint[];
}


// ============================================================
// SERVICIO
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  private readonly http =
    inject(HttpClient);


  private readonly base =
    `${environment.apiUrl}/orders/metrics`;


  // ==========================================================
  // MÉTRICAS GENERALES
  // ==========================================================

  get(
    period: SalesPeriod = '30d'
  ): Observable<DashboardMetrics> {

    return this.http.get<DashboardMetrics>(
      this.base,
      {
        params: {
          period
        }
      }
    );
  }


  // ==========================================================
  // VENTAS POR PERÍODO
  // ==========================================================

  getSales(
    period: SalesPeriod
  ): Observable<SalesByPeriod> {

    return this.http.get<SalesByPeriod>(
      `${this.base}/sales`,
      {
        params: {
          period
        }
      }
    );
  }
}