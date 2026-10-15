import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const user = auth.currentUser();

  // Si no hay usuario, o el usuario es admin, lo pateamos al catálogo o al panel de admin
  if (user && user.role === 'admin') {
    router.navigate(['/admin']);
    return false;
  }

  return true; // Si es un cliente normal (o un visitante), lo dejamos pasar
};