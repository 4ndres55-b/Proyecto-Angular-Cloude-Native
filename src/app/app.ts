import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { NavbarComponent } from './core/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  user: any = null;
  private readonly destroying$ = new Subject<void>();

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cdr: ChangeDetectorRef,
    private appAuthService: AuthService
  ) { }

  ngOnInit(): void {
    this.actualizarUsuario();

    this.msalBroadcastService.inProgress$.pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None),
      takeUntil(this.destroying$)
    ).subscribe(() => {
      this.actualizarUsuario();
    });
  }

  private actualizarUsuario(): void {
    let activeAccount = this.authService.instance.getActiveAccount();
    const accounts = this.authService.instance.getAllAccounts();

    if (!activeAccount && accounts.length > 0) {
      activeAccount = accounts[0];
      this.authService.instance.setActiveAccount(activeAccount);
    }

    this.user = activeAccount ?? null;
    this.appAuthService.actualizarUsuario();
    this.cdr.markForCheck();
  }

  // <-- AGREGAR ESTE MÉTODO DE NUEVO -->
  login(): void {
    this.authService.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    });
  }

  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }
}