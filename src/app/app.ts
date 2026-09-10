import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult, InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  user: AccountInfo | null = null;
  private readonly destroying$ = new Subject<void>();

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.authService.handleRedirectObservable({
      navigateToLoginRequestUrl: false
    }).subscribe({

      next: (result: AuthenticationResult | null) => {

        if (result?.account) {
          this.authService.instance.setActiveAccount(result.account);
        }

        const activeAccount =
          this.authService.instance.getActiveAccount();

        const accounts =
          this.authService.instance.getAllAccounts();

        if (activeAccount) {
          this.user = activeAccount;
        }
        else if (accounts.length > 0) {

          this.authService.instance.setActiveAccount(accounts[0]);
          this.user = accounts[0];
        }
        else {
          this.user = null;
        }
      },

      error: (error) => {
        console.error('Error MSAL:', error);
      }
    });
  }


  // 2. Escucha el momento exacto en que MSAL termina de cargar (InteractionStatus.None)


  private actualizarUsuario(): void {
    let activeAccount = this.authService.instance.getActiveAccount();
    const accounts = this.authService.instance.getAllAccounts();

    if (!activeAccount && accounts.length > 0) {
      activeAccount = accounts[0];
      this.authService.instance.setActiveAccount(activeAccount);
    }

    this.user = activeAccount ?? null;

    // 3. ¡La clave para Angular 21! Obliga a la interfaz a mostrar los datos actualizados
    this.cdr.markForCheck();
  }

  login(): void {
    this.authService.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    });
  }

  logout(): void {
    this.authService.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:4200'
    });
  }

  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }
}