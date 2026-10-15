import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { UsdPipe } from '../../../../../shared/pipes/usd.pipe';

import {
  ORDER_STATUS_LABELS,
  OrderStatus
} from '../../../../orders/models/order.model';

import {
  DashboardMetrics,
  MetricsService,
  SalesByPeriod,
  SalesPeriod,
  SalesPoint
} from '../../services/metrics.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    UsdPipe
  ],

  templateUrl:
    './dashboard.component.html',

  styleUrl:
    './dashboard.component.scss'
})
export class AdminDashboardComponent
  implements OnInit {

  private readonly metricsService =
    inject(MetricsService);


  // ==========================================================
  // MÉTRICAS GENERALES
  // ==========================================================

  readonly metrics =
    signal<DashboardMetrics | null>(null);


  readonly loading =
    signal(true);


  readonly metricsError =
    signal(false);


  readonly statusLabels =
    ORDER_STATUS_LABELS;


  readonly statusOrder:
    OrderStatus[] = [
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ];


  // ==========================================================
  // PERÍODO DE VENTAS
  // ==========================================================

  readonly selectedSalesPeriod =
    signal<SalesPeriod>('30d');


  readonly salesLoading =
    signal(false);


  readonly salesError =
    signal(false);


  readonly salesData =
    signal<SalesPoint[]>([]);


  readonly salesPeriodRevenue =
    computed(() => {

      return this.salesData()
        .reduce(
          (
            total,
            point
          ) =>
            total +
            point.revenue,

          0
        );
    });


  readonly salesPeriodOrders =
    computed(() => {

      return this.salesData()
        .reduce(
          (
            total,
            point
          ) =>
            total +
            point.orders,

          0
        );
    });


  readonly salesPeriodAverage =
    computed(() => {

      const orders =
        this.salesPeriodOrders();

      if (orders === 0) {
        return 0;
      }

      return (
        this.salesPeriodRevenue() /
        orders
      );
    });


  // ==========================================================
  // ESCALA DE BARRAS DE ESTADO
  // ==========================================================

  readonly maxStatusCount =
    computed(() => {

      const metrics =
        this.metrics();

      if (!metrics) {
        return 1;
      }

      return Math.max(
        1,

        ...this.statusOrder.map(
          status =>
            metrics.ordersByStatus[status] ?? 0
        )
      );
    });


  // ==========================================================
  // ESCALA DEL GRÁFICO DE VENTAS
  // ==========================================================

  readonly maxSalesRevenue =
    computed(() => {

      const values =
        this.salesData()
          .map(
            point =>
              point.revenue
          );

      return Math.max(
        1,
        ...values
      );
    });


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadMetrics();

    this.loadSales(
      this.selectedSalesPeriod()
    );
  }


  // ==========================================================
  // CARGAR MÉTRICAS GENERALES
  // ==========================================================

  private loadMetrics(): void {

    this.loading.set(true);

    this.metricsError.set(false);


    this.metricsService
      .get(
        this.selectedSalesPeriod()
      )
      .subscribe({

        next: (
          metrics: DashboardMetrics
        ) => {

          this.metrics.set(
            metrics
          );

          this.loading.set(
            false
          );
        },

        error: () => {

          this.metricsError.set(
            true
          );

          this.loading.set(
            false
          );
        }

      });
  }


  // ==========================================================
  // CAMBIAR PERÍODO
  // ==========================================================

  changeSalesPeriod(
    period: SalesPeriod
  ): void {

    if (
      this.selectedSalesPeriod() ===
      period
    ) {
      return;
    }

    this.selectedSalesPeriod.set(
      period
    );

    this.loadSales(
      period
    );
  }


  // ==========================================================
  // CARGAR VENTAS
  // ==========================================================

  private loadSales(
    period: SalesPeriod
  ): void {

    this.salesLoading.set(
      true
    );

    this.salesError.set(
      false
    );


    this.metricsService
      .getSales(period)
      .subscribe({

        next: (
          response: SalesByPeriod
        ) => {

          this.salesData.set(
            response.points
          );

          this.salesLoading.set(
            false
          );
        },

        error: (
          error: unknown
        ) => {

          console.error(
            'Error al cargar ventas por período:',
            error
          );

          this.salesData.set(
            []
          );

          this.salesError.set(
            true
          );

          this.salesLoading.set(
            false
          );
        }

      });
  }


  // ==========================================================
  // PORCENTAJE DE UNA BARRA DE VENTA
  // ==========================================================

  salesBarWidth(
    revenue: number
  ): number {

    const max =
      this.maxSalesRevenue();

    if (
      max <= 0 ||
      revenue <= 0
    ) {
      return 0;
    }

    return (
      revenue / max
    ) * 100;
  }


  // ==========================================================
  // FORMATEAR TIEMPO DE ENTREGA
  // ==========================================================

  formatDeliveryTime(
    hours: number
  ): string {

    if (
      hours < 24
    ) {

      return `${hours.toFixed(1)} h`;
    }

    return `${(
      hours / 24
    ).toFixed(1)} días`;
  }
}