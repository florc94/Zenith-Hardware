import { CommonModule } from '@angular/common';
import { UsdPipe } from '../../../../../shared/pipes/usd.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ORDER_STATUS_LABELS,
  Order,
  OrderStatus,
  isFinalStatus,
  nextStatus
} from '../../../../orders/models/order.model';
import { AdminOrderService } from '../../services/admin-order.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog.service';

type ViewMode = 'kanban' | 'list';

const BOARD_COLUMNS: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];

@Component({
  selector: 'app-admin-order-board',
  standalone: true,
  imports: [CommonModule, FormsModule, UsdPipe],
  templateUrl: './order-board.component.html',
  styleUrl: './order-board.component.scss'
})
export class AdminOrderBoardComponent implements OnInit {
  private adminOrderService = inject(AdminOrderService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmDialogService); 

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly columns = BOARD_COLUMNS;
  readonly isFinalStatus = isFinalStatus;
  readonly nextStatus = nextStatus;

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly viewMode = signal<ViewMode>('kanban');
  readonly search = signal('');

  // Signals de Paginación Server-Side
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);
  readonly itemsPerPage = 10;

  readonly selectedIds = signal<Set<number>>(new Set());
  readonly selectedOrderToView = signal<Order | null>(null);

  readonly expandedColumns = signal<Set<OrderStatus>>(new Set([BOARD_COLUMNS[0]]));
  readonly expandedListRows = signal<Set<number>>(new Set());

  private searchInput = new Subject<string>();

  readonly filteredOrders = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.orders();
    return this.orders().filter(
      (o) =>
        String(o.id).includes(term) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(term)) ||
        (o.client && o.client.toLowerCase().includes(term))
    );
  });

  constructor() {
    this.searchInput.pipe(debounceTime(250), distinctUntilChanged()).subscribe((term) => {
      this.search.set(term);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  onSearchInput(value: string): void {
    this.searchInput.next(value);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.selectedIds.set(new Set());
  }

  ordersInColumn(status: OrderStatus): Order[] {
    return this.filteredOrders().filter((o) => o.status === status);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelection(id: number): void {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }

  selectedCountIn(status: OrderStatus): number {
    const ids = this.selectedIds();
    return this.ordersInColumn(status).filter((o) => ids.has(o.id)).length;
  }

  advance(order: Order): void {
    const target = nextStatus(order.status);
    if (!target) return;
    this.updateStatus(order.id, target);
  }

  cancel(order: Order): void {
    const confirmed = window.confirm(
      `El pedido ${order.id} de ${order.client} se va a marcar como cancelado.\n\nEsta acción no se puede deshacer.\n¿Querés cancelar el pedido?`
    );
    if (!confirmed) return;
    this.updateStatus(order.id, 'cancelled');
  }

  async bulkAdvance(status: OrderStatus): Promise<void> {
    const target = nextStatus(status);
    if (!target) return;

    const ids = this.ordersInColumn(status)
      .filter((o) => this.selectedIds().has(o.id))
      .map((o) => o.id);

    if (ids.length === 0) return;

    const confirmed = await this.confirm.ask({
      title: 'Avanzar pedidos seleccionados',
      message: `${ids.length} pedido(s) van a pasar de "${this.statusLabels[status as OrderStatus]}" a "${this.statusLabels[target]}".`,
      confirmLabel: 'Avanzar'
    });
    if (!confirmed) return;

    forkJoin(
      ids.map((id) =>
        this.adminOrderService.updateStatus(id, target).pipe(catchError(() => of(null)))
      )
    ).subscribe((results) => {
      const succeeded = results.filter((r) => r !== null).length;
      const failed = results.length - succeeded;

      if (failed === 0) {
        this.notify.success(`${succeeded} pedido(s) avanzados a "${this.statusLabels[target]}"`);
      } else {
        this.notify.error(`${succeeded} avanzados, ${failed} fallaron (puede que ya hayan cambiado de estado)`);
      }

      this.clearSelectionIn(status);
      this.load();
    });
  }

  // Métodos de Paginación Server-Side
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.load();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.load();
    }
  }

  private clearSelectionIn(status: OrderStatus): void {
    const columnIds = new Set(this.ordersInColumn(status).map((o) => o.id));
    const next = new Set([...this.selectedIds()].filter((id) => !columnIds.has(id)));
    this.selectedIds.set(next);
  }

  private updateStatus(orderId: number, status: OrderStatus): void {
    this.adminOrderService.updateStatus(orderId, status).subscribe({
      next: (updated) => {
        // Casteo aplicado aquí para calmar al compilador de Angular
        this.notify.success(`Pedido ${updated.id} → ${this.statusLabels[updated.status as OrderStatus]}`);
        this.load(); 
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.notify.error('Hubo un problema al cambiar el estado del pedido en el servidor.');
      }
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminOrderService.getAll(this.currentPage(), this.itemsPerPage).subscribe({
      next: (response) => {
        this.orders.set(response.data);
        this.currentPage.set(response.meta.currentPage);
        this.totalPages.set(response.meta.totalPages);
        this.totalItems.set(response.meta.totalItems);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openOrderDetails(order: Order): void {
    this.selectedOrderToView.set(order);
  }

  closeOrderDetails(): void {
    this.selectedOrderToView.set(null);
  }

  toggleColumn(status: OrderStatus): void {
    const next = new Set(this.expandedColumns());
    next.has(status) ? next.delete(status) : next.add(status);
    this.expandedColumns.set(next);
  }

  toggleListRow(id: number): void {
    const next = new Set(this.expandedListRows());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedListRows.set(next);
  }
}