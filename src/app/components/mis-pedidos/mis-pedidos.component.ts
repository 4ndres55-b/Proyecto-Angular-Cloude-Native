import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pedidos-page">
      <div class="page-header">
        <h1>📋 Mis Pedidos</h1>
        <p>Seguimiento en tiempo real de tus órdenes procesadas por RabbitMQ</p>
        <button class="btn-refresh" (click)="cargarPedidos()">🔄 Actualizar</button>
      </div>

      <div *ngIf="cargando" class="loading-state">
        <div class="spinner"></div>
        <p>Consultando AWS RDS...</p>
      </div>

      <div *ngIf="!cargando && pedidos.length === 0" class="empty-state">
        <p class="empty-icon">🍽️</p>
        <h3>No tienes pedidos aún</h3>
        <p>Visita nuestra carta y realiza tu primer pedido</p>
      </div>

      <div class="pedidos-lista" *ngIf="!cargando && pedidos.length > 0">
        <div *ngFor="let pedido of pedidos" class="pedido-card">
          <div class="pedido-header">
            <div class="pedido-id">
              <span class="id-label">Pedido</span>
              <span class="id-valor">#{{ pedido.id }}</span>
            </div>
            <span class="estado-badge" [class]="getClaseEstado(pedido.estado)">
              {{ getIconoEstado(pedido.estado) }} {{ pedido.estado }}
            </span>
          </div>
          <div class="pedido-detalles" *ngIf="pedido.detalles && pedido.detalles.length > 0">
            <div *ngFor="let item of pedido.detalles" class="detalle-item">
              <span class="item-nombre">{{ item.nombreProducto || 'Producto #' + item.productoId }}</span>
              <span class="item-cant">x{{ item.cantidad }}</span>
              <span class="item-precio">\${{ (item.precioUnitario * item.cantidad) | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="pedido-footer">
            <div class="pipeline">
              <div class="step" [class.done]="isPasoCompletado('CREADO', pedido.estado)">
                <span class="step-dot"></span>
                <span class="step-label">Recibido</span>
              </div>
              <div class="step-line" [class.done]="isPasoCompletado('EN_PREPARACION', pedido.estado)"></div>
              <div class="step" [class.done]="isPasoCompletado('EN_PREPARACION', pedido.estado)">
                <span class="step-dot"></span>
                <span class="step-label">En Cocina</span>
              </div>
              <div class="step-line" [class.done]="isPasoCompletado('LISTO', pedido.estado)"></div>
              <div class="step" [class.done]="isPasoCompletado('LISTO', pedido.estado)">
                <span class="step-dot"></span>
                <span class="step-label">Listo</span>
              </div>
            </div>
            <span class="total-pedido">\${{ pedido.total | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pedidos-page { min-height: calc(100vh - 65px); padding: 2rem; background: #0f0f19; }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem; }
    .page-header p { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0 0 1rem; }
    .btn-refresh {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-refresh:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .loading-state { text-align: center; padding: 4rem; color: rgba(255,255,255,0.5); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,149,0,0.2); border-top-color: #ff9500; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 5rem 2rem; color: rgba(255,255,255,0.4); }
    .empty-icon { font-size: 4rem; margin: 0 0 1rem; }
    .empty-state h3 { color: rgba(255,255,255,0.6); font-size: 1.2rem; margin: 0 0 0.5rem; }
    .pedidos-lista { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .pedido-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
      transition: border-color 0.2s ease;
    }
    .pedido-card:hover { border-color: rgba(255,149,0,0.3); }
    .pedido-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .pedido-id { display: flex; flex-direction: column; }
    .id-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
    .id-valor { font-size: 1.4rem; font-weight: 800; color: #fff; }
    .estado-badge {
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .estado-creado { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
    .estado-en_preparacion { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
    .estado-listo { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .estado-default { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.15); }
    .pedido-detalles { margin-bottom: 1.2rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem; }
    .detalle-item { display: flex; align-items: center; gap: 1rem; padding: 4px 0; color: rgba(255,255,255,0.7); font-size: 0.85rem; }
    .item-nombre { flex: 1; }
    .item-cant { color: rgba(255,255,255,0.4); }
    .item-precio { color: #ff9500; font-weight: 600; }
    .pedido-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); }
    .pipeline { display: flex; align-items: center; gap: 0; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .step-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.2); transition: all 0.3s; }
    .step.done .step-dot { background: #ff9500; border-color: #ff9500; box-shadow: 0 0 8px rgba(255,149,0,0.5); }
    .step-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); white-space: nowrap; }
    .step.done .step-label { color: #ff9500; }
    .step-line { width: 40px; height: 2px; background: rgba(255,255,255,0.1); transition: background 0.3s; }
    .step-line.done { background: #ff9500; }
    .total-pedido { font-size: 1.3rem; font-weight: 800; color: #ff9500; }
  `]
})
export class MisPedidosComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  cargando = true;
  private destroy$ = new Subject<void>();
  private pasos = ['CREADO', 'EN_PREPARACION', 'LISTO'];

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void { this.cargarPedidos(); }

  cargarPedidos(): void {
    this.cargando = true;
    this.pedidoService.obtenerPedidos().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.pedidos = p;
      this.cargando = false;
    });
  }

  getClaseEstado(estado: string): string {
    const mapa: Record<string, string> = {
      'CREADO': 'estado-badge estado-creado',
      'EN_PREPARACION': 'estado-badge estado-en_preparacion',
      'LISTO': 'estado-badge estado-listo'
    };
    return mapa[estado] || 'estado-badge estado-default';
  }

  getIconoEstado(estado: string): string {
    const iconos: Record<string, string> = { 'CREADO': '🔵', 'EN_PREPARACION': '🍳', 'LISTO': '✅' };
    return iconos[estado] || '📦';
  }

  isPasoCompletado(paso: string, estadoActual: string): boolean {
    return this.pasos.indexOf(estadoActual) >= this.pasos.indexOf(paso);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
