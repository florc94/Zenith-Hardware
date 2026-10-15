import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UsdPipe } from '../../../../shared/pipes/usd.pipe';

import {
  Order,
  OrderStatus,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS
} from '../../models/order.model';

import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UsdPipe
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {

  private readonly orderService = inject(OrderService);

  readonly id = input.required<string>();

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly orderStatusFlow = ORDER_STATUS_FLOW;
  readonly statusLabels = ORDER_STATUS_LABELS;

  /**
   * Índice del estado actual.
   *
   * paid        -> 0
   * processing  -> 1
   * shipped     -> 2
   * delivered   -> 3
   */
  readonly currentStatusIndex = computed(() => {
    const currentOrder = this.order();

    if (!currentOrder) {
      return -1;
    }

    return this.orderStatusFlow.indexOf(currentOrder.status);
  });

  /**
   * Porcentaje visual de progreso.
   */
  readonly progressPercentage = computed(() => {
    const index = this.currentStatusIndex();

    if (index < 0) {
      return 0;
    }

    if (this.orderStatusFlow.length <= 1) {
      return 100;
    }

    return (index / (this.orderStatusFlow.length - 1)) * 100;
  });

  /**
   * Cantidad total de unidades compradas.
   */
  readonly itemCount = computed(() => {
    const currentOrder = this.order();

    if (!currentOrder) {
      return 0;
    }

    return currentOrder.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  });

  /**
   * Subtotal.
   *
   * Primero usa el subtotal guardado en la orden.
   * Si no existe, lo calcula a partir de los productos.
   */
  readonly subtotal = computed(() => {
    const currentOrder = this.order();

    if (!currentOrder) {
      return 0;
    }

    if (typeof currentOrder.subtotal === 'number') {
      return currentOrder.subtotal;
    }

    return currentOrder.items.reduce(
      (total, item) => total + item.subtotal,
      0
    );
  });

  /**
   * Costo de envío.
   *
   * Si viene guardado en la orden, usamos ese valor.
   * Si no, calculamos la diferencia entre total y subtotal.
   */
  readonly shippingCost = computed(() => {
    const currentOrder = this.order();

    if (!currentOrder) {
      return 0;
    }

    if (typeof currentOrder.costoEnvio === 'number') {
      return currentOrder.costoEnvio;
    }

    const calculatedShipping =
      currentOrder.total - this.subtotal();

    return Math.max(0, calculatedShipping);
  });

  ngOnInit(): void {
    const orderId = Number(this.id());

    if (!Number.isFinite(orderId)) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.orderService.getById(orderId).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
        this.error.set(false);
      },

      error: () => {
        this.order.set(null);
        this.loading.set(false);
        this.error.set(true);
      }
    });
  }

  /**
   * Determina si un paso ya fue completado.
   */
  isStatusCompleted(index: number): boolean {
    const currentIndex = this.currentStatusIndex();

    if (currentIndex < 0) {
      return false;
    }

    return index <= currentIndex;
  }

  /**
   * Obtiene la fecha en la que ocurrió un estado.
   */
  getStatusDate(status: OrderStatus): string | null {
    const currentOrder = this.order();

    if (!currentOrder?.statusHistory?.length) {
      return null;
    }

    const event = currentOrder.statusHistory.find(
      (item) => item.status === status
    );

    return event?.at ?? null;
  }

  /**
   * Formatea una fecha para mostrarla en el historial.
   */
  formatDate(date: string | null): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsedDate);
  }

  /**
   * Fecha de creación del pedido.
   */
  getCreatedDate(): string {
    const currentOrder = this.order();

    if (!currentOrder) {
      return '';
    }

    return this.formatDate(currentOrder.createdAt);
  }
}