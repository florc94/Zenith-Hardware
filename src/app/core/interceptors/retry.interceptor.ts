import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  retry,
  timer
} from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {

  // Solo reintentamos peticiones GET.
  // Evitamos repetir operaciones que modifican datos.
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(

    retry({
      // Máximo de 2 reintentos adicionales.
      count: 2,

      delay: (error: HttpErrorResponse, retryCount) => {

        // ==========================================
        // ERRORES DE CLIENTE (4xx)
        // ==========================================

        const isClientError =
          error.status >= 400 &&
          error.status < 500;

        if (isClientError) {
          // 400, 401, 403, 404, 422, etc.
          // No tiene sentido repetir automáticamente.
          throw error;
        }


        // ==========================================
        // ERRORES DE RED
        // ==========================================

        const isNetworkError =
          error.status === 0;


        // ==========================================
        // ERRORES DEL SERVIDOR (5xx)
        // ==========================================

        const isServerError =
          error.status >= 500 &&
          error.status < 600;


        // ==========================================
        // REINTENTO
        // ==========================================

        if (isNetworkError || isServerError) {

          console.warn(
            `⚠️ Falló GET ${req.url}. ` +
            `Reintentando (${retryCount}/2)...`
          );

          // Backoff progresivo:
          // Retry 1 → 1 segundo
          // Retry 2 → 2 segundos
          return timer(retryCount * 1000);
        }


        // Cualquier otro error se propaga
        // sin realizar reintentos.
        throw error;
      }
    })

  );
};