import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

/**
 * Diálogo de confirmación como servicio + signal, en vez de un
 * componente que cada pantalla instancia por separado: cualquier
 * parte del admin puede pedir `await confirm.ask(...)` y el
 * <app-confirm-dialog> (montado una sola vez en el shell del admin)
 * se encarga de mostrarse y devolver la respuesta.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly request = signal<PendingConfirm | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise((resolve) => {
      this.request.set({ ...request, resolve });
    });
  }

  resolve(confirmed: boolean): void {
    this.request()?.resolve(confirmed);
    this.request.set(null);
  }
}
