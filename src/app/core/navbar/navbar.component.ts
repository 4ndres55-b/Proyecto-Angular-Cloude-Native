import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
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