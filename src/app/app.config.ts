import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MsalService, MSAL_INSTANCE, MsalBroadcastService, MsalGuard } from '@azure/msal-angular';
import { IPublicClientApplication } from '@azure/msal-browser';
import { routes } from './app.routes';
import { MSALInstanceFactory } from './msal-config';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export function initializeMsal(msalInstance: IPublicClientApplication): () => Promise<void> {
  return async () => {
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise().catch((error) => {
      console.error('Error en handleRedirectPromise:', error);
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMsal,
      deps: [MSAL_INSTANCE],
      multi: true
    },
    MsalService,
    MsalBroadcastService,
    MsalGuard
  ]
};