import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../services/local/auth-state.service';

export const authGuard: CanActivateFn = () => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  if (authStateService.hasToken()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
