import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Protege todo /admin/**. Si no hay sesión, va a login (como authGuard);
 * si hay sesión pero no es admin, se le avisa y se lo manda al catálogo
 * en vez de dejarlo en un 404 silencioso.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!auth.isAdmin()) {
    notify.error('Esa sección es sólo para administradores.');
    router.navigate(['/catalogo']);
    return false;
  }

  return true;
};
