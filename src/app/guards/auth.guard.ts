import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

/**
 * Guard funcional de autenticación para Angular 22.
 * Protege las rutas y redirige al login si no hay sesión activa con Microsoft Azure AD.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const msalService = inject(MsalService);
  const router = inject(Router);

  const accounts = msalService.instance.getAllAccounts();
  const activeAccount = msalService.instance.getActiveAccount();

  if (accounts.length > 0 || activeAccount) {
    return true;
  }

  // Sin sesión activa, redirigir al inicio
  router.navigate(['/']);
  return false;
};
