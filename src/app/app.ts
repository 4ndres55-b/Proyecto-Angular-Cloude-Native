import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  MsalBroadcastService,
  MsalService
} from '@azure/msal-angular';

import {
  AccountInfo,
  AuthenticationResult,
  InteractionStatus
} from '@azure/msal-browser';

import { Subject } from 'rxjs';

import {
  filter,
  takeUntil
} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  user: AccountInfo | null = null;

  private readonly destroying$ =
    new Subject<void>();


  constructor(
    private authService : MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cdr: ChangeDetectorRef
    
  ) {}


  ngOnInit(): void {
    this.authService.handleRedirectObservable({
        navigateToLoginRequestUrl: false
    })
    .subscribe({
        next: (result: AuthenticationResult | null) => {
          if (result?.account) {
            this.authService.instance.setActiveAccount(result.account);
          }
        },
        error: (error) => {console.error('Error MSAL:',error);
        }
    });
    this.msalBroadcastService.inProgress$.pipe(
        filter((status: InteractionStatus) =>status === InteractionStatus.None),
        takeUntil(this.destroying$)
      )
      .subscribe(() => {
        this.actualizarUsuario();
      });

  }


  private actualizarUsuario(): void {
    let activeAccount =
      this.authService.instance
        .getActiveAccount();
    const accounts =
      this.authService.instance
        .getAllAccounts();


    console.log(
      '🔵 Cuentas MSAL:',
      accounts.length,
      accounts
    );

    console.log(
      '🟢 Cuenta activa:',
      activeAccount
    );


    // Si MSAL tiene una cuenta,
    // pero todavía no está marcada como activa,
    // usamos la primera encontrada.
    if (
      !activeAccount &&
      accounts.length > 0
    ) {

      activeAccount =
        accounts[0];

      this.authService.instance
        .setActiveAccount(
          activeAccount
        );

    }


    // Actualizar el usuario mostrado
    // en la interfaz.
    this.user =
      activeAccount ?? null;


    // Angular 21 trabaja de forma zoneless
    // en proyectos actuales.
    // Informamos que la vista debe actualizarse.
    this.cdr.markForCheck();

  }


  login(): void {

    this.authService
      .loginRedirect({

        scopes: [
          'openid',
          'profile',
          'email'
        ]

      });

  }


  logout(): void {

    console.log(
      '🔴 Cerrando sesión manualmente'
    );

    this.authService
      .logoutRedirect({

        postLogoutRedirectUri:
          'http://localhost:4200'

      });

  }


  ngOnDestroy(): void {

    this.destroying$.next();

    this.destroying$.complete();

  }

}