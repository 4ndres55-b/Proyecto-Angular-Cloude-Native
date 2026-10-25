import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminColasService } from '../../services/admin-colas.service';
import { PedidoService } from '../../services/pedido.service';
import { ColaRequest, RespuestaAdmin, ColaInfo } from '../../models/cola.model';
import { Pedido } from '../../models/pedido.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="admin-header">
        <h1>⚙️ Panel Administrador</h1>
        <p>Gestión de órdenes y microservicio de mensajería RabbitMQ</p>
      </div>

      <!-- Pestañas -->
      <div class="tabs">
        <button class="tab" [class.activa]="tabActiva === 'pedidos'" (click)="tabActiva = 'pedidos'">
          📦 Todas las Órdenes
        </button>
        <button class="tab" [class.activa]="tabActiva === 'colas'" (click)="tabActiva = 'colas'">
          🐇 Gestión de Colas RabbitMQ
        </button>
      </div>

      <!-- === TAB PEDIDOS === -->
      <div class="tab-content" *ngIf="tabActiva === 'pedidos'">
        <div class="seccion-header">
          <h2>Órdenes en el sistema</h2>
          <button class="btn-refresh" (click)="cargarPedidos()">🔄 Actualizar</button>
        </div>
        <div *ngIf="cargandoPedidos" class="loading-mini"><div class="spinner"></div></div>
        <div class="tabla-container" *ngIf="!cargandoPedidos">
          <table class="tabla-admin">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pedido of pedidos">
                <td class="id-col">#{{ pedido.id }}</td>
                <td class="user-col">{{ pedido.username }}</td>
                <td>{{ pedido.detalles?.length || 0 }} item(s)</td>
                <td class="total-col">\${{ pedido.total | number:'1.0-0' }}</td>
                <td>
                  <span class="badge" [class]="getBadgeEstado(pedido.estado)">
                    {{ pedido.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="pedidos.length === 0" class="sin-datos">No hay pedidos registrados aún.</p>
        </div>
      </div>

      <!-- === TAB COLAS === -->
      <div class="tab-content" *ngIf="tabActiva === 'colas'">
        <div class="colas-grid">

          <!-- Crear Cola -->
          <div class="card-admin">
            <h3>➕ Crear Cola</h3>
            <p class="card-desc">Crea una nueva cola en el broker RabbitMQ via <code>POST /colas</code></p>
            <div class="form-group">
              <label>Nombre de la Cola</label>
              <input
                type="text"
                [(ngModel)]="nuevaColaNombre"
                placeholder="ej: pedidos.express"
                class="input-admin"
                [class.input-error]="errorNombre" />
              <span class="error-msg" *ngIf="errorNombre">{{ errorNombre }}</span>
            </div>
            <div class="toggle-group">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="nuevaColaDurable" />
                <span>Durable (sobrevive al reinicio del broker)</span>
              </label>
            </div>
            <button class="btn-action btn-crear" (click)="crearCola()" [disabled]="creandoCola">
              {{ creandoCola ? 'Creando...' : '✅ Crear Cola' }}
            </button>
            <div class="respuesta-box" *ngIf="respuestaCrear">
              <span [class.exito]="respuestaCrear.exitoso" [class.error]="!respuestaCrear.exitoso">
                {{ respuestaCrear.exitoso ? '✅' : '❌' }} {{ respuestaCrear.mensaje }}
              </span>
            </div>
          </div>

          <!-- Consultar Cola -->
          <div class="card-admin">
            <h3>🔍 Consultar Cola</h3>
            <p class="card-desc">Verifica el estado de una cola via <code>GET /colas/&#123;nombre&#125;</code></p>
            <div class="form-group">
              <label>Nombre de la Cola</label>
              <input type="text" [(ngModel)]="consultarColaNombre" placeholder="ej: pedidos.cocina" class="input-admin" />
            </div>
            <button class="btn-action btn-consultar" (click)="consultarCola()" [disabled]="consultandoCola">
              {{ consultandoCola ? 'Consultando...' : '🔍 Consultar' }}
            </button>
            <div class="info-box" *ngIf="infoConsulta">
              <div *ngIf="infoConsulta.existe">
                <p class="info-linea">✅ <strong>Cola activa</strong></p>
                <p class="info-linea">📨 Mensajes listos: <span class="info-valor">{{ infoConsulta.mensajesListos ?? 0 }}</span></p>
                <p class="info-linea">👥 Consumidores activos: <span class="info-valor">{{ infoConsulta.consumidoresActivos ?? 0 }}</span></p>
              </div>
              <div *ngIf="!infoConsulta.existe">
                <p class="info-linea error">❌ {{ infoConsulta.mensaje }}</p>
              </div>
            </div>
          </div>

          <!-- Eliminar Cola -->
          <div class="card-admin">
            <h3>🗑️ Eliminar Cola</h3>
            <p class="card-desc">Elimina una cola del broker via <code>DELETE /colas/&#123;nombre&#125;</code></p>
            <div class="form-group">
              <label>Nombre de la Cola a Eliminar</label>
              <input type="text" [(ngModel)]="eliminarColaNombre" placeholder="ej: pedidos.express" class="input-admin" />
            </div>
            <button class="btn-action btn-eliminar" (click)="eliminarCola()" [disabled]="eliminandoCola">
              {{ eliminandoCola ? 'Eliminando...' : '🗑️ Eliminar Cola' }}
            </button>
            <div class="respuesta-box" *ngIf="respuestaEliminar">
              <span [class.exito]="respuestaEliminar.exitoso" [class.error]="!respuestaEliminar.exitoso">
                {{ respuestaEliminar.exitoso ? '✅' : '❌' }} {{ respuestaEliminar.mensaje }}
              </span>
            </div>
          </div>

          <!-- Info de Colas del Sistema -->
          <div class="card-admin card-info">
            <h3>📡 Colas del Sistema</h3>
            <p class="card-desc">Colas configuradas en el microservicio de Órdenes</p>
            <div class="cola-sistema" *ngFor="let cola of colasDelSistema">
              <div class="cola-nombre">{{ cola.nombre }}</div>
              <div class="cola-desc">{{ cola.descripcion }}</div>
              <div class="cola-tipo" [class]="cola.tipo">{{ cola.etiqueta }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { min-height: calc(100vh - 65px); padding: 2rem; background: #0f0f19; }
    .admin-header { text-align: center; margin-bottom: 2rem; }
    .admin-header h1 { font-size: 2rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem; }
    .admin-header p { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0; }
    .tab {
      padding: 10px 20px;
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      margin-bottom: -1px;
    }
    .tab.activa { color: #a78bfa; border-bottom-color: #a78bfa; }
    .tab:hover { color: rgba(255,255,255,0.8); }
    .tab-content { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .seccion-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .seccion-header h2 { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0; }
    .btn-refresh { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); padding: 7px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
    .btn-refresh:hover { background: rgba(255,255,255,0.1); }
    .loading-mini { text-align: center; padding: 2rem; }
    .spinner { width: 30px; height: 30px; border: 3px solid rgba(167,139,250,0.2); border-top-color: #a78bfa; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .tabla-container { overflow-x: auto; }
    .tabla-admin { width: 100%; border-collapse: collapse; }
    .tabla-admin th { padding: 10px 14px; text-align: left; font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .tabla-admin td { padding: 12px 14px; font-size: 0.85rem; color: rgba(255,255,255,0.75); border-bottom: 1px solid rgba(255,255,255,0.05); }
    .tabla-admin tr:hover td { background: rgba(255,255,255,0.02); }
    .id-col { color: rgba(255,255,255,0.4); font-weight: 700; }
    .user-col { color: rgba(255,255,255,0.9); }
    .total-col { color: #ff9500; font-weight: 700; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
    .badge-creado { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .badge-en_preparacion { background: rgba(251,146,60,0.15); color: #fb923c; }
    .badge-listo { background: rgba(34,197,94,0.15); color: #4ade80; }
    .badge-default { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .sin-datos { text-align: center; color: rgba(255,255,255,0.3); padding: 2rem; }
    .colas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; max-width: 1100px; }
    .card-admin { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; }
    .card-admin h3 { color: #fff; font-size: 1rem; font-weight: 700; margin: 0 0 0.4rem; }
    .card-desc { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin: 0 0 1.2rem; line-height: 1.5; }
    .card-desc code { background: rgba(167,139,250,0.1); color: #a78bfa; padding: 1px 6px; border-radius: 4px; font-size: 0.78rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem; font-weight: 600; }
    .input-admin {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .input-admin:focus { border-color: #a78bfa; }
    .input-error { border-color: rgba(239, 68, 68, 0.6) !important; }
    .error-msg { font-size: 0.75rem; color: #f87171; margin-top: 0.3rem; display: block; }
    .toggle-group { margin-bottom: 1rem; }
    .toggle-label { display: flex; align-items: center; gap: 0.6rem; color: rgba(255,255,255,0.6); font-size: 0.82rem; cursor: pointer; }
    .btn-action {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: none;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-action:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-crear { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid rgba(139,92,246,0.4); }
    .btn-crear:hover:not(:disabled) { background: rgba(139, 92, 246, 0.3); }
    .btn-consultar { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
    .btn-consultar:hover:not(:disabled) { background: rgba(59, 130, 246, 0.25); }
    .btn-eliminar { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
    .btn-eliminar:hover:not(:disabled) { background: rgba(239, 68, 68, 0.22); }
    .respuesta-box, .info-box { margin-top: 1rem; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.8rem; }
    .exito { color: #4ade80; }
    .error { color: #f87171; }
    .info-linea { margin: 0.3rem 0; color: rgba(255,255,255,0.7); font-size: 0.82rem; }
    .info-valor { color: #ff9500; font-weight: 700; }
    .card-info { border-color: rgba(255,149,0,0.15); }
    .cola-sistema { padding: 0.8rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .cola-sistema:last-child { border-bottom: none; }
    .cola-nombre { color: #fff; font-size: 0.85rem; font-weight: 700; margin-bottom: 2px; font-family: monospace; }
    .cola-desc { color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-bottom: 4px; }
    .cola-tipo { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; display: inline-block; }
    .tipo-principal { background: rgba(34,197,94,0.15); color: #4ade80; }
    .tipo-dlq { background: rgba(239,68,68,0.15); color: #f87171; }
  `]
})
export class AdminComponent implements OnInit, OnDestroy {
  tabActiva = 'pedidos';
  pedidos: Pedido[] = [];
  cargandoPedidos = true;
  nuevaColaNombre = '';
  nuevaColaDurable = true;
  consultarColaNombre = '';
  eliminarColaNombre = '';
  creandoCola = false;
  consultandoCola = false;
  eliminandoCola = false;
  errorNombre = '';
  respuestaCrear: RespuestaAdmin | null = null;
  respuestaEliminar: RespuestaAdmin | null = null;
  infoConsulta: ColaInfo | null = null;
  private destroy$ = new Subject<void>();

  colasDelSistema = [
    { nombre: 'pedidos.cocina', descripcion: 'Recibe eventos de nuevos pedidos para preparación en cocina.', tipo: 'tipo-principal', etiqueta: 'Activa' },
    { nombre: 'pedidos.tickets', descripcion: 'Genera boletas y comprobantes de forma asíncrona.', tipo: 'tipo-principal', etiqueta: 'Activa' },
    { nombre: 'pedidos.dlq', descripcion: 'Dead Letter Queue: almacena mensajes rechazados con NACK.', tipo: 'tipo-dlq', etiqueta: 'DLQ' }
  ];

  constructor(
    private adminService: AdminColasService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void { this.cargarPedidos(); }

  cargarPedidos(): void {
    this.cargandoPedidos = true;
    this.pedidoService.obtenerPedidos().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.pedidos = p;
      this.cargandoPedidos = false;
    });
  }

  getBadgeEstado(estado: string): string {
    const m: Record<string, string> = { 'CREADO': 'badge badge-creado', 'EN_PREPARACION': 'badge badge-en_preparacion', 'LISTO': 'badge badge-listo' };
    return m[estado] || 'badge badge-default';
  }

  crearCola(): void {
    this.errorNombre = '';
    this.respuestaCrear = null;
    if (!this.nuevaColaNombre.trim() || this.nuevaColaNombre.trim().length < 3) {
      this.errorNombre = 'El nombre debe tener al menos 3 caracteres.';
      return;
    }
    const req: ColaRequest = { nombre: this.nuevaColaNombre.trim(), durable: this.nuevaColaDurable };
    this.creandoCola = true;
    this.adminService.crearCola(req).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.respuestaCrear = r;
      this.creandoCola = false;
      if (r.exitoso) { this.nuevaColaNombre = ''; }
    });
  }

  consultarCola(): void {
    if (!this.consultarColaNombre.trim()) return;
    this.infoConsulta = null;
    this.consultandoCola = true;
    this.adminService.consultarCola(this.consultarColaNombre.trim()).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.infoConsulta = r;
      this.consultandoCola = false;
    });
  }

  eliminarCola(): void {
    if (!this.eliminarColaNombre.trim()) return;
    this.respuestaEliminar = null;
    this.eliminandoCola = true;
    this.adminService.eliminarCola(this.eliminarColaNombre.trim()).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.respuestaEliminar = r;
      this.eliminandoCola = false;
      if (r.exitoso) { this.eliminarColaNombre = ''; }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
