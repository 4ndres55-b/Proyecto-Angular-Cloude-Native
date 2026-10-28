import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interceptor HTTP funcional para Angular 22.
 * Adiciona el Access Token a las llamadas hacia BFF y microservicios internos.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const msalService = inject(MsalService);
  const activeAccount = msalService.instance.getActiveAccount() || msalService.instance.getAllAccounts()[0];

  const esUrlBackend =
    req.url.includes('localhost:8080') ||
    req.url.includes('localhost:8084') ||
    req.url.startsWith('/api');

  if (!activeAccount || !esUrlBackend) {
    return next(req);
  }

  return from(
    msalService.instance.acquireTokenSilent({
      account: activeAccount,
      scopes: [environment.apiScope]
    })
  ).pipe(
    switchMap((authResult) => {
      const token = authResult.accessToken || authResult.idToken;
      if (!token) {
        return next(req);
      }

      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(authReq);
    }),
    catchError((error) => {
      console.warn('No se pudo adquirir token silenciosamente para la API del backend. Reintentando con idToken:', error);

      const fallbackToken = (activeAccount as any).idToken;
      if (fallbackToken) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${fallbackToken}`
          }
        });
        return next(authReq);
      }

      return next(req);
    })
  );
};
