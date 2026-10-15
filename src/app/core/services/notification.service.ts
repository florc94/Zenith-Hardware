import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';


export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId: number | null;
  isRead: boolean;
  createdAt: string;
}


export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/notifications';


  // =====================================================
  // TOASTS
  // =====================================================

  readonly toasts =
    signal<ToastItem[]>([]);

  private toastId = 0;


  success(
    message: string
  ): void {

    this.showToast(
      message,
      'success'
    );

  }


  error(
    message: string
  ): void {

    this.showToast(
      message,
      'error'
    );

  }


  info(
    message: string
  ): void {

    this.showToast(
      message,
      'info'
    );

  }


  private showToast(
    message: string,
    type: 'success' | 'error' | 'info'
  ): void {

    const id =
      ++this.toastId;

    this.toasts.update(
      toasts => [
        ...toasts,
        {
          id,
          message,
          type
        }
      ]
    );

    setTimeout(() => {

      this.dismiss(id);

    }, 3500);

  }


  dismiss(
    id: number
  ): void {

    this.toasts.update(
      toasts =>
        toasts.filter(
          toast =>
            toast.id !== id
        )
    );

  }


  // =====================================================
  // NOTIFICACIONES DE PEDIDOS
  // =====================================================

  readonly notifications =
    signal<NotificationItem[]>([]);


  readonly unreadCount =
    signal(0);


  readonly loading =
    signal(false);


  // =====================================================
  // OBTENER NOTIFICACIONES
  // =====================================================

  loadNotifications(): void {

    this.loading.set(true);

    this.http
      .get<NotificationItem[]>(
        this.apiUrl
      )
      .subscribe({

        next: (
          notifications
        ) => {

          this.notifications.set(
            notifications
          );

          this.updateUnreadCount(
            notifications
          );

          this.loading.set(false);

        },

        error: (
          error
        ) => {

          console.error(
            'Error al cargar notificaciones:',
            error
          );

          this.loading.set(false);

        }

      });

  }


  // =====================================================
  // OBTENER SOLO CANTIDAD DE NO LEÍDAS
  // =====================================================

  loadUnreadCount(): void {

    this.http
      .get<{ count: number }>(
        `${this.apiUrl}/unread-count`
      )
      .subscribe({

        next: (
          response
        ) => {

          this.unreadCount.set(
            response.count
          );

        },

        error: (
          error
        ) => {

          console.error(
            'Error al obtener cantidad de notificaciones:',
            error
          );

        }

      });

  }


  // =====================================================
  // MARCAR UNA COMO LEÍDA
  // =====================================================

  markAsRead(
    notificationId: number
  ): Observable<void> {

    return this.http
      .patch<void>(
        `${this.apiUrl}/${notificationId}/read`,
        {}
      );

  }


  // =====================================================
  // MARCAR TODAS COMO LEÍDAS
  // =====================================================

  markAllAsRead(): void {

    this.http
      .patch(
        `${this.apiUrl}/read-all`,
        {}
      )
      .subscribe({

        next: () => {

          this.notifications.update(
            notifications =>
              notifications.map(
                notification => ({
                  ...notification,
                  isRead: true
                })
              )
          );

          this.unreadCount.set(0);

        },

        error: (
          error
        ) => {

          console.error(
            'Error al marcar todas las notificaciones como leídas:',
            error
          );

        }

      });

  }


  // =====================================================
  // ACTUALIZAR CONTADOR LOCAL
  // =====================================================

  private updateUnreadCount(
    notifications: NotificationItem[]
  ): void {

    const count =
      notifications.filter(
        notification =>
          !notification.isRead
      ).length;

    this.unreadCount.set(
      count
    );

  }

}