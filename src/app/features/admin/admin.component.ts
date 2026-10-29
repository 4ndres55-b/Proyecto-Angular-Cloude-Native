import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminColasService } from '../../core/services/admin-colas.service';
import { PedidoService } from '../../core/services/pedido.service';
import { CatalogoService } from '../../core/services/catalogo.service'; // IMPORTANTE
import { ColaRequest, RespuestaAdmin, ColaInfo } from '../../shared/models/cola.model';
import { Pedido } from '../../shared/models/pedido.model';
import { Producto } from '../../shared/models/producto.model'; // IMPORTANTE
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
  
  // --- VARIABLES DE PEDIDOS ---
  pedidos: Pedido[] = [];
  cargandoPedidos = true;

  // --- VARIABLES DE CATÁLOGO (NUEVAS) ---
  productos: Producto[] = [];
  cargandoProductos = false;
  // El nuevo producto ahora tiene todos los campos que exige el backend
  nuevoProducto: Producto = { nombre: '', precio: 0, stock: 0, descripcion: '', categoria: '' };
  imagenSeleccionada: File | undefined;
  guardandoProducto = false;
  eliminandoProductoId: number | null = null;
  errorCatalogo = '';

  // --- VARIABLES DE COLAS ---
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
    private pedidoService: PedidoService,
    private catalogoService: CatalogoService // Inyectamos el servicio
  ) {}

  ngOnInit(): void { 
    this.cargarPedidos(); 
    this.cargarProductos(); // Cargamos los productos al iniciar
  }

  // ==========================================
  // METODOS DE PEDIDOS
  // ==========================================
  cargarPedidos(): void {
    this.cargandoPedidos = true;
    this.pedidoService.obtenerPedidos().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.pedidos = p;
      this.cargandoPedidos = false;
    });
  }

  getBadgeEstado(estado: string): string {
    const m: Record<string, string> = { 
      [EstadoPedido.CREADO]: 'badge badge-creado', 
      [EstadoPedido.EN_PREPARACION]: 'badge badge-en_preparacion', 
      [EstadoPedido.LISTO]: 'badge badge-listo' 
    };
    return m[estado] || 'badge badge-default';
  }

  // ==========================================
  // METODOS DE CATÁLOGO (NUEVOS)
  // ==========================================
  cargarProductos(): void {
    this.cargandoProductos = true;
    this.catalogoService.obtenerProductos().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.productos = p;
      this.cargandoProductos = false;
    });
  }

  // Método para capturar el archivo de imagen desde el HTML
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
    }
  }

  crearProducto(): void {
    this.errorCatalogo = '';
    // Validamos los campos obligatorios del nuevo backend
    if (!this.nuevoProducto.nombre || this.nuevoProducto.precio <= 0 || !this.nuevoProducto.categoria) {
      this.errorCatalogo = 'Nombre, precio y categoría son obligatorios.';
      return;
    }
    
    this.guardandoProducto = true;
    // Enviamos el producto y el archivo de imagen al servicio
    this.catalogoService.agregarProducto(this.nuevoProducto, this.imagenSeleccionada)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.cargarProductos(); 
          this.nuevoProducto = { nombre: '', precio: 0, stock: 0, descripcion: '', categoria: '' };
          this.imagenSeleccionada = undefined;
          this.guardandoProducto = false;
        },
        error: () => {
          this.errorCatalogo = 'Error al guardar el producto.';
          this.guardandoProducto = false;
        }
      });
  }

  eliminarProducto(id: number | undefined): void {
    if (!id) return;
    this.eliminandoProductoId = id;
    this.catalogoService.eliminarProducto(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.productos = this.productos.filter(p => p.id !== id);
        this.eliminandoProductoId = null;
      },
      error: () => {
        this.errorCatalogo = 'Error al eliminar el producto.';
        this.eliminandoProductoId = null;
      }
    });
  }

  // ==========================================
  // METODOS DE COLAS
  // ==========================================
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