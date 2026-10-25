import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <span class="brand-icon">🍔</span>
        <span class="brand-name">Pedidos<span class="brand-accent">360</span></span>
        <span class="brand-badge">Cloud Native</span>
      </div>

      <div class="navbar-links" *ngIf="autenticado">
        <a routerLink="/menu" routerLinkActive="active" class="nav-link">
          <span class="nav-icon">🍽️</span>
          <span>Menú</span>
        </a>
        <a routerLink="/mis-pedidos" routerLinkActive="active" class="nav-link">
          <span class="nav-icon">📋</span>
          <span>Mis Pedidos</span>
        </a>
        <a *ngIf="esAdmin" routerLink="/admin" routerLinkActive="active" class="nav-link nav-link-admin">
          <span class="nav-icon">⚙️</span>
          <span>Panel Admin</span>
        </a>
      </div>

      <div class="navbar-user" *ngIf="autenticado">
        <div class="rol-toggle" *ngIf="autenticado">
          <button class="btn-rol" (click)="toggleRol()" [class.admin-mode]="esAdmin">
            {{ esAdmin ? '👑 Admin' : '👤 Cliente' }}
          </button>
        </div>
        <div class="user-info">
          <div class="user-avatar">{{ iniciales }}</div>
          <div class="user-details">
            <span class="user-name">{{ nombreCorto }}</span>
            <span class="user-email">{{ email }}</span>
          </div>
        </div>
        <button class="btn-logout" (click)="logout()" title="Cerrar sesión">
          <span>⏏</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 65px;
      background: rgba(15, 15, 25, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 165, 0, 0.2);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }
    .brand-icon { font-size: 1.6rem; }
    .brand-name {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .brand-accent { color: #ff9500; }
    .brand-badge {
      font-size: 0.6rem;
      background: rgba(255, 149, 0, 0.15);
      border: 1px solid rgba(255, 149, 0, 0.4);
      color: #ff9500;
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .navbar-links {
      display: flex;
      gap: 0.5rem;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .nav-link:hover, .nav-link.active {
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
    }
    .nav-link-admin.active { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
    .nav-link-admin:hover { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
    .nav-icon { font-size: 1rem; }
    .navbar-user { display: flex; align-items: center; gap: 0.8rem; }
    .btn-rol {
      font-size: 0.75rem;
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 600;
    }
    .btn-rol.admin-mode {
      border-color: rgba(167, 139, 250, 0.5);
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
    }
    .btn-rol:hover { opacity: 0.85; transform: scale(1.02); }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9500, #ff6b00);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      color: #fff;
      flex-shrink: 0;
    }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 0.8rem; font-weight: 600; color: #fff; line-height: 1.2; }
    .user-email { font-size: 0.7rem; color: rgba(255,255,255,0.45); line-height: 1.2; }
    .btn-logout {
      background: rgba(255, 59, 59, 0.1);
      border: 1px solid rgba(255, 59, 59, 0.3);
      color: rgba(255, 100, 100, 0.8);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s ease;
    }
    .btn-logout:hover { background: rgba(255, 59, 59, 0.2); color: #ff6060; }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  autenticado = false;
  esAdmin = true;
  nombreCorto = '';
  email = '';
  iniciales = '';
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.autenticado = !!user;
      if (user) {
        const nombre = user.name || user.username || '';
        this.email = user.username;
        const partes = nombre.split(' ');
        this.nombreCorto = partes.slice(0, 2).join(' ');
        this.iniciales = partes.filter(p => p.length > 0).slice(0, 2).map(p => p[0].toUpperCase()).join('');
        if (!this.iniciales && user.username) this.iniciales = user.username.substring(0, 2).toUpperCase();
      }
    });
    this.authService.esAdmin$.pipe(takeUntil(this.destroy$)).subscribe(es => this.esAdmin = es);
  }

  toggleRol(): void { this.authService.toggleRolAdmin(); }
  logout(): void { this.authService.logout(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
