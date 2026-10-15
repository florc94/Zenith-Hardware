import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { UsdPipe } from '../../../../shared/pipes/usd.pipe';
import { AuthService } from '../../../../core/services/auth.service';

import {
  ORDER_STATUS_LABELS,
  Order
} from '../../models/order.model';

import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UsdPipe
  ],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss'
})
export class OrderHistoryComponent implements OnInit {

  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);

  // =====================================================
  // ESTADO
  // =====================================================

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly statusLabels = ORDER_STATUS_LABELS;

  // =====================================================
  // PAGINACIÓN
  // =====================================================

  readonly pageSize = 10;

  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);

  /** Primer y último pedido que se muestran en la página actual */
  readonly firstItem = computed(() =>
    this.totalItems() === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize + 1
  );

  readonly lastItem = computed(() =>
    Math.min(
      this.currentPage() * this.pageSize,
      this.totalItems()
    )
  );

  /**
   * Números de página a mostrar. `null` representa "…".
   * Ej: 1 … 4 5 6 … 12
   */
  readonly pageNumbers = computed<(number | null)[]>(() => {

    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from(
        { length: total },
        (_, i) => i + 1
      );
    }

    const pages: (number | null)[] = [1];

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) {
      pages.push(null);
    }

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }

    if (end < total - 1) {
      pages.push(null);
    }

    pages.push(total);

    return pages;
  });

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    if (!this.auth.currentUser()) {
      this.loading.set(false);
      return;
    }

    this.loadPage(1);
  }

  // =====================================================
  // CARGA DE PEDIDOS
  // =====================================================

  loadPage(page: number): void {

    const user = this.auth.currentUser();

    if (!user) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.orderService
      .getByUser(user.id, page, this.pageSize)
      .subscribe({

        next: (response) => {

          this.orders.set(response.data);

          this.currentPage.set(response.meta.currentPage);
          this.totalPages.set(
            Math.max(response.meta.totalPages, 1)
          );
          this.totalItems.set(response.meta.totalItems);

          this.loading.set(false);

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        },

        error: (error) => {

          console.error(
            '❌ Error cargando pedidos:',
            error
          );

          this.error.set(true);
          this.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage() ||
      this.loading()
    ) {
      return;
    }

    this.loadPage(page);
  }

  // =====================================================
  // HELPERS
  // =====================================================

  getItemCount(order: Order): number {
    return order.items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }

  getProductLineCount(order: Order): number {
    return order.items.length;
  }
}