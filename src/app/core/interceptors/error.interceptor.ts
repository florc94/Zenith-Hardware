import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  catchError,
  throwError
} from 'rxjs';

import {
  AuthService
} from '../services/auth.service';

import {
  NotificationService
} from '../services/notification.service';

/**
 * Punto único de manejo de errores HTTP.
 *
 * Un 401 solo se interpreta como "sesión expirada"
 * si el usuario tenía una sesión/token activo.
 *
 * Esto permite que las rutas públicas funcionen
 * correctamente para visitantes sin autenticación.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const notify =
    inject(NotificationService);

  const auth =
    inject(AuthService);

  const router =
    inject(Router);

  return next(req).pipe(

    catchError(
      (err: HttpErrorResponse) => {

        switch (err.status) {

          case 401: {

            const hasSession =
              !!auth.getToken();

            if (hasSession) {

              notify.error(
                'Tu sesión expiró, iniciá sesión nuevamente.'
              );

              auth.logout();

              router.navigate(['/login']);
            }

            break;
          }

          case 403:

            notify.error(
              'No tenés permisos para realizar esta acción.'
            );

            break;

          case 404:

            notify.error(
              'El recurso solicitado no existe.'
            );

            break;

          case 0:

            notify.error(
              'No se pudo conectar con el servidor. ¿Está corriendo la API?'
            );

            break;

          default:

            notify.error(
              'Ocurrió un error inesperado. Intentá de nuevo.'
            );

            break;
        }

        return throwError(
          () => err
        );
      }
    )
  );
};