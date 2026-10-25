import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<AccountInfo | null>(null);
  public user$: Observable<AccountInfo | null> = this.userSubject.asObservable();

  private rolAdminSubject = new BehaviorSubject<boolean>(false);
  public esAdmin$: Observable<boolean> = this.rolAdminSubject.asObservable();

  constructor(private msalService: MsalService) {
    this.actualizarUsuario();
  }

  public actualizarUsuario(): void {
    let account = this.msalService.instance.getActiveAccount();
    const accounts = this.msalService.instance.getAllAccounts();

    if (!account && accounts.length > 0) {
      account = accounts[0];
      this.msalService.instance.setActiveAccount(account);
    }

    this.userSubject.next(account ?? null);
    this.rolAdminSubject.next(this.esRolAdministrador(account));
  }

  private esRolAdministrador(account: AccountInfo | null): boolean {
    if (!account) return false;

    const claims = account.idTokenClaims as Record<string, unknown> | undefined;
    const roles = Array.isArray(claims?.['roles']) ? claims['roles'] as string[] : [];
    const groups = Array.isArray(claims?.['groups']) ? claims['groups'] as string[] : [];

    const todosLosRoles = [...roles, ...groups];
    return todosLosRoles.some((rol) => {
      const valor = String(rol).toLowerCase();
      return valor.includes('admin') || valor.includes('administrador');
    });
  }

  public getUsuarioActual(): AccountInfo | null {
    return this.userSubject.value;
  }

  public estaAutenticado(): boolean {
    return this.userSubject.value !== null;
  }

  public getUsername(): string {
    const user = this.getUsuarioActual();
    return user?.username || 'usuario@duocuc.cl';
  }

  public getNombreCompleto(): string {
    const user = this.getUsuarioActual();
    return user?.name || user?.username || 'Estudiante Cloud Native';
  }

  public getTenantId(): string {
    const user = this.getUsuarioActual();
    return user?.tenantId || '1587de59-3259-4555-988c-2907c91e031c';
  }

  public toggleRolAdmin(): void {
    this.rolAdminSubject.next(!this.rolAdminSubject.value);
  }

  public setRolAdmin(valor: boolean): void {
    this.rolAdminSubject.next(valor);
  }

  public login(): void {
    this.msalService.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    });
  }

  public logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:4200'
    });
  }
}
