import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // <-- Importado aquí
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../core/services/pedido.service';
import { Pedido } from '../../shared/models/pedido.model';
import { EstadoPedido } from '../../shared/models/estado-pedido.enum';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  cargando = true;
  estados = EstadoPedido;
  private destroy$ = new Subject<void>();
  
  private pasos = [EstadoPedido.CREADO, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO];

  constructor(
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef // <-- Inyectado aquí
  ) {}

  ngOnInit(): void { 
    this.cargarPedidos(); 
  }

  cargarPedidos(): void {
    this.cargando = true;
    this.pedidoService.obtenerPedidos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (p) => {
        this.pedidos = p;
        this.cargando = false;
        this.cdr.detectChanges(); // <-- Obliga a Angular a actualizar el HTML
      },
      error: (err) => {
        console.error('Error al cargar mis pedidos:', err);
        this.cargando = false; // <-- Apaga el spinner si hay error
        this.cdr.detectChanges(); // <-- Actualiza la pantalla para mostrar mensaje vacío
      }
    });
  }

  getClaseEstado(estado: string): string {
    const mapa: Record<string, string> = {
      [EstadoPedido.CREADO]: 'estado-badge estado-creado',
      [EstadoPedido.EN_PREPARACION]: 'estado-badge estado-en_preparacion',
      [EstadoPedido.LISTO]: 'estado-badge estado-listo'
    };
    return mapa[estado] || 'estado-badge estado-default';
  }

  getIconoEstado(estado: string): string {
    const iconos: Record<string, string> = { 
      [EstadoPedido.CREADO]: '🔵', 
      [EstadoPedido.EN_PREPARACION]: '🍳', 
      [EstadoPedido.LISTO]: '✅' 
    };
    return iconos[estado] || '📦';
  }

  isPasoCompletado(paso: string, estadoActual: string): boolean {
    return this.pasos.indexOf(estadoActual as EstadoPedido) >= this.pasos.indexOf(paso as EstadoPedido);
  }

  ngOnDestroy(): void { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }
}