import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

export const authGuard: CanActivateFn = (route, state) => {
  const msalService = inject(MsalService);

  try {
    const accounts = msalService.instance.getAllAccounts();
    const activeAccount = msalService.instance.getActiveAccount();

    if (accounts.length > 0 || activeAccount) {
      if (!activeAccount && accounts.length > 0) {
        msalService.instance.setActiveAccount(accounts[0]);
      }
      return true;
    }
  } catch (e) {
    console.error('MSAL aún no está listo en el guard:', e);
  }

  // Redirige al login si no hay sesión activa
  msalService.loginRedirect({
    scopes: ['openid', 'profile', 'email']
  });

  return false;
};