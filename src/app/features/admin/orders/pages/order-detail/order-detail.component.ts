import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
    Order,
    ORDER_STATUS_FLOW,
    ORDER_STATUS_LABELS,
    isFinalStatus,
    nextStatus
} from '../../../../orders/models/order.model';

import { AdminOrderService } from '../../services/admin-order.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog.service';
import { UsdPipe } from '../../../../../shared/pipes/usd.pipe';

@Component({
    selector: 'app-admin-order-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        UsdPipe
    ],
    templateUrl: './order-detail.component.html',
    styleUrl: './order-detail.component.scss'
})
export class AdminOrderDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private adminOrderService = inject(AdminOrderService);
    private notify = inject(NotificationService);
    private confirm = inject(ConfirmDialogService);

    readonly order = signal<Order | null>(null);
    readonly loading = signal(true);

    readonly statusLabels = ORDER_STATUS_LABELS;
    readonly statusFlow = ORDER_STATUS_FLOW;
    readonly isFinalStatus = isFinalStatus;

    /**
     * Índice del estado actual dentro del flujo normal.
     *
     * No usamos statusHistory porque el backend actual
     * no almacena historial de estados.
     */
    readonly currentStatusIndex = computed(() => {
        const o = this.order();

        if (!o) {
            return -1;
        }

        return ORDER_STATUS_FLOW.indexOf(o.status);
    });

    readonly nextStepLabel = computed(() => {
        const o = this.order();

        if (!o) {
            return null;
        }

        const next = nextStatus(o.status);

        return next
            ? this.statusLabels[next]
            : null;
    });

    ngOnInit(): void {
        const id = Number(
            this.route.snapshot.paramMap.get('id')
        );

        if (!id || Number.isNaN(id)) {
            this.notify.error('Pedido inválido');
            this.router.navigate(['/admin/orders']);
            return;
        }

        this.load(id);
    }

    advance(): void {
        const o = this.order();

        if (!o) {
            return;
        }

        const next = nextStatus(o.status);

        if (!next) {
            return;
        }

        this.adminOrderService
            .updateStatus(o.id, next)
            .subscribe({
                next: () => {
                    this.load(o.id);

                    this.notify.success(
                        `Pedido ${o.id} → ${this.statusLabels[next]}`
                    );
                },
                error: () => {
                    this.notify.error(
                        'No se pudo actualizar el estado del pedido'
                    );
                }
            });
    }

    async cancel(): Promise<void> {
        const o = this.order();

        if (!o) {
            return;
        }

        const confirmed = await this.confirm.ask({
            title: 'Cancelar pedido',
            message: `El pedido ${o.id} se va a marcar como cancelado. Esta acción no se puede deshacer.`,
            confirmLabel: 'Cancelar pedido',
            danger: true
        });

        if (!confirmed) {
            return;
        }

        this.adminOrderService
            .updateStatus(o.id, 'cancelled')
            .subscribe({
                next: () => {
                    this.load(o.id);

                    this.notify.success(
                        `Pedido ${o.id} cancelado`
                    );
                },
                error: () => {
                    this.notify.error(
                        'No se pudo cancelar el pedido'
                    );
                }
            });
    }

    private load(id: number): void {
        this.loading.set(true);

        this.adminOrderService
            .getById(id)
            .subscribe({
                next: (order) => {
                    this.order.set(order);
                    this.loading.set(false);
                },
                error: () => {
                    this.order.set(null);
                    this.loading.set(false);

                    this.notify.error(
                        'No se encontró ese pedido'
                    );
                }
            });
    }
}