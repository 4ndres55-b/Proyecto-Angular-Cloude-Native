import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { AuthService } from '../../../core/services/auth.service';
import { Producto } from '../../../shared/models/producto.model';
import { ProductoCardComponent } from '../producto/producto-card.component';
import { CarritoComponent, ItemCarrito } from '../carrito/carrito.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductoCardComponent, CarritoComponent],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: string[] = ['Todas'];
  categoriaActiva = 'Todas';
  
  carrito: ItemCarrito[] = [];
  carritoVisible = false;
  cargando = true;
  enviandoPedido = false;
  toastVisible = false;
  private destroy$ = new Subject<void>();

  constructor(
    private catalogoService: CatalogoService,
    private pedidoService: PedidoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.catalogoService.obtenerProductos().pipe(takeUntil(this.destroy$)).subscribe(productos => {
      this.productos = productos;
      this.productosFiltrados = productos;
      
      const cats = new Set(productos.map(p => p.categoria).filter(c => c));
      this.categorias = ['Todas', ...Array.from(cats)];
      this.cargando = false;

      console.log('Productos obtenidos:', productos);
      console.log(this.cargando);
    });
  }

  filtrarCategoria(cat: string): void {
    this.categoriaActiva = cat;
    this.productosFiltrados = cat === 'Todas' ? this.productos : this.productos.filter(p => p.categoria === cat);
  }

  agregarAlCarrito(producto: Producto): void {
    const existente = this.carrito.find(i => i.productoId === producto.id);
    if (existente) {
      existente.cantidad++;
    } else {
      this.carrito.push({
        productoId: producto.id!,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio,
        imagen: producto.urlImg 
      });
    }
    this.carritoVisible = true;
  }

  decrementarItem(index: number): void {
    if (this.carrito[index].cantidad > 1) {
      this.carrito[index].cantidad--;
    } else {
      this.carrito.splice(index, 1);
    }
  }

  incrementarItem(index: number): void {
    this.carrito[index].cantidad++;
  }

  get totalCarrito(): number {
    return this.carrito.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);
  }

  get totalItems(): number {
    return this.carrito.reduce((acc, i) => acc + i.cantidad, 0);
  }

  confirmarPedido(): void {
    if (this.carrito.length === 0) return;
    this.enviandoPedido = true;

    this.pedidoService.crearPedido({
      username: this.authService.getUsername(),
      total: this.totalCarrito,
      detalles: this.carrito.map(i => ({
        productoId: i.productoId,
        nombreProducto: i.nombreProducto,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario
      }))
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.carrito = [];
        this.carritoVisible = false;
        this.enviandoPedido = false;
        this.mostrarToast();
      },
      error: () => {
        this.enviandoPedido = false;
      }
    });
  }

  mostrarToast(): void {
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 4000);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}