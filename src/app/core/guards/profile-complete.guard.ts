import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Bloquea el checkout si el cliente no cargó DNI,
 * código de área y teléfono en Mi Cuenta.
 * Lo redirige a Mi Cuenta y conserva la URL para volver.
 *
 * Va DESPUÉS de customerGuard: ese se encarga de
 * los usuarios sin sesión o administradores.
 */
export const profileCompleteGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  if (!user || user.role === 'admin' || user.profileComplete) {
    return true;
  }

  const isEnglish =
    window.location.pathname === '/en' ||
    window.location.pathname.startsWith('/en/');

  return router.createUrlTree(
    [isEnglish ? '/account' : '/cuenta'],
    { queryParams: { returnUrl: state.url } }
  );
};