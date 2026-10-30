import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminColasService } from '../../core/services/admin-colas.service';
import { PedidoService } from '../../core/services/pedido.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ColaRequest, RespuestaAdmin, ColaInfo } from '../../shared/models/cola.model';
import { Pedido } from '../../shared/models/pedido.model';
import { Producto } from '../../shared/models/producto.model';
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
  cargandoPedidos = false;

  productos: Producto[] = [];
  cargandoProductos = false;
  nuevoProducto: Producto = { nombre: '', precio: 0, stock: 0, descripcion: '', categoria: '' };
  imagenSeleccionada: File | undefined;
  guardandoProducto = false;
  eliminandoProductoId: number | null = null;
  errorCatalogo = '';

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
  
  colasRealesBroker: any[] = [];
  cargandoColasBroker = false;
  errorColasBroker = '';
  
  mensajesEnCola: any[] = [];
  viendoMensajesCola: string | null = null;
  cargandoMensajes = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminColasService,
    private pedidoService: PedidoService,
    private catalogoService: CatalogoService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void { 
    this.cargarPedidos(); 
    this.cargarProductos();
    this.cargarColasDesdeBroker();
  }

  cargarPedidos(): void {
    this.cargandoPedidos = true;
    this.pedidoService.obtenerPedidos().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.pedidos = p;
      this.cargandoPedidos = false;
      this.cdr.detectChanges(); 
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

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.catalogoService.obtenerProductos().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.productos = p;
      this.cargandoProductos = false;
      this.cdr.detectChanges(); 
    });
  }

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
    }
  }

  crearProducto(): void {
    this.errorCatalogo = '';
    if (!this.nuevoProducto.nombre || this.nuevoProducto.precio <= 0 || !this.nuevoProducto.categoria) {
      this.errorCatalogo = 'Nombre, precio y categoría son obligatorios.';
      return;
    }
    
    this.guardandoProducto = true;
    this.catalogoService.agregarProducto(this.nuevoProducto, this.imagenSeleccionada)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.cargarProductos(); 
          this.nuevoProducto = { nombre: '', precio: 0, stock: 0, descripcion: '', categoria: '' };
          this.imagenSeleccionada = undefined;
          this.guardandoProducto = false;
          this.cdr.detectChanges(); 
        },
        error: () => {
          this.errorCatalogo = 'Error al guardar el producto.';
          this.guardandoProducto = false;
          this.cdr.detectChanges(); 
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
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.errorCatalogo = 'Error al eliminar el producto.';
        this.eliminandoProductoId = null;
        this.cdr.detectChanges(); 
      }
    });
  }

  cargarColasDesdeBroker(): void {
    this.cargandoColasBroker = true;
    this.errorColasBroker = '';

    this.adminService.listarColas().pipe(takeUntil(this.destroy$)).subscribe({
        next: (colas) => {
          this.colasRealesBroker = colas;
          this.cargandoColasBroker = false;
          this.cdr.detectChanges(); 
        },
        error: () => {
          this.errorColasBroker = 'No se pudo cargar el listado de colas en vivo.';
          this.cargandoColasBroker = false;
          this.cdr.detectChanges(); 
        }
      });
  }

  crearCola(): void {
    this.errorNombre = '';
    this.respuestaCrear = null;
    
    if (!this.nuevaColaNombre.trim() || this.nuevaColaNombre.trim().length < 3) {
      this.errorNombre = 'El nombre debe tener al menos 3 caracteres.';
      return;
    }

    const req: ColaRequest = { 
        nombre: this.nuevaColaNombre.trim(), 
        durable: this.nuevaColaDurable,
        exclusiva: false,
        autoDelete: false
    };
    
    this.creandoCola = true;
    
    this.adminService.crearCola(req).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.respuestaCrear = r;
      this.creandoCola = false;
      
      if (r.exitoso) { 
        this.nuevaColaNombre = '';
        this.cargarColasDesdeBroker();
      }
      this.cdr.detectChanges(); 
    });
  }

  consultarCola(): void {
    if (!this.consultarColaNombre.trim()) return;
    
    this.infoConsulta = null;
    this.consultandoCola = true;
    
    this.adminService.consultarCola(this.consultarColaNombre.trim()).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.infoConsulta = r;
      this.consultandoCola = false; 
      this.cdr.detectChanges(); 
    });
  }

  eliminarCola(): void {
    if (!this.eliminarColaNombre.trim()) return;
    
    this.respuestaEliminar = null;
    this.eliminandoCola = true;
    
    this.adminService.eliminarCola(this.eliminarColaNombre.trim()).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.respuestaEliminar = r;
      this.eliminandoCola = false;
      
      if (r.exitoso) { 
        this.eliminarColaNombre = '';
        this.cargarColasDesdeBroker(); 
      }
      this.cdr.detectChanges(); 
    });
  }
  
  verMensajes(nombreCola: string): void {
      if (this.viendoMensajesCola === nombreCola) {
          // Si hace clic en "Ocultar"
          this.viendoMensajesCola = null;
          this.mensajesEnCola = [];
          this.cdr.detectChanges(); // Repintar inmediatamente
          return; // Salir de la función aquí
      }
      this.viendoMensajesCola = nombreCola;
      this.cargandoMensajes = true;
      this.mensajesEnCola = [];
      this.cdr.detectChanges(); // Mostrar el loader
      
      this.adminService.leerMensajes(nombreCola).pipe(takeUntil(this.destroy$)).subscribe(mensajes => {
          this.mensajesEnCola = mensajes.map(msg => {
              let contenidoParseado = msg.contenido;
              try {
                  if (typeof msg.contenido === 'string') {
                      contenidoParseado = JSON.parse(msg.contenido);
                  }
              } catch (e) {}
              return { ...msg, contenido: contenidoParseado };
          });
          this.cargandoMensajes = false;
          this.cdr.detectChanges(); // Mostrar los mensajes ya renderizados
      });
  }

  ngOnDestroy(): void { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }
}