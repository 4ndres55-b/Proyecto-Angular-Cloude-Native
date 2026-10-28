import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminColasService } from '../../core/services/admin-colas.service';
import { PedidoService } from '../../core/services/pedido.service';
import { ColaRequest, RespuestaAdmin, ColaInfo } from '../../shared/models/cola.model';
import { Pedido } from '../../shared/models/pedido.model';
import { EstadoPedido } from '../../shared/models/estado-pedido.enum';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
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

  // Actualizado para usar el Enum
  getBadgeEstado(estado: string): string {
    const m: Record<string, string> = { 
      [EstadoPedido.CREADO]: 'badge badge-creado', 
      [EstadoPedido.EN_PREPARACION]: 'badge badge-en_preparacion', 
      [EstadoPedido.LISTO]: 'badge badge-listo' 
    };
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