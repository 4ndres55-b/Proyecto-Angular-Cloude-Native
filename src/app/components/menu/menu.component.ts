import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../services/catalogo.service';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Producto } from '../../models/producto.model';
import { DetallePedido } from '../../models/pedido.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ItemCarrito extends DetallePedido {
  imagen?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-page">
      <div class="menu-header">
        <h1 class="menu-title">🍽️ Nuestra Carta</h1>
        <p class="menu-subtitle">Ingredientes frescos · Preparación artesanal · Entrega directa de la cocina</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="cargando" class="loading-state">
        <div class="spinner"></div>
        <p>Conectando con AWS RDS...</p>
      </div>

      <!-- Categorías -->
      <div class="categorias" *ngIf="!cargando">
        <button
          *ngFor="let cat of categorias"
          class="btn-categoria"
          [class.activa]="categoriaActiva === cat"
          (click)="filtrarCategoria(cat)">
          {{ cat }}
        </button>
      </div>

      <!-- Grid de Productos -->
      <div class="productos-grid" *ngIf="!cargando">
        <div
          *ngFor="let producto of productosFiltrados"
          class="producto-card"
          [class.agotado]="(producto.stock || 0) === 0">
          <div class="producto-imagen">
            <img [src]="producto.imagen" [alt]="producto.nombre" (error)="onImgError($event)" />
            <span class="categoria-badge">{{ producto.categoria }}</span>
            <span class="stock-badge" *ngIf="(producto.stock || 0) <= 5 && (producto.stock || 0) > 0">
              ¡Últimas {{ producto.stock }}!
            </span>
          </div>
          <div class="producto-info">
            <h3>{{ producto.nombre }}</h3>
            <p class="producto-desc">{{ producto.descripcion }}</p>
            <div class="producto-footer">
              <span class="producto-precio">\${{ producto.precio | number:'1.0-0' }}</span>
              <button
                class="btn-agregar"
                (click)="agregarAlCarrito(producto)"
                [disabled]="(producto.stock || 0) === 0">
                {{ (producto.stock || 0) === 0 ? 'Agotado' : '+ Agregar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Carrito Lateral -->
      <div class="carrito-panel" [class.abierto]="carritoVisible">
        <div class="carrito-header">
          <h3>🛒 Tu Pedido</h3>
          <button class="btn-cerrar-carrito" (click)="carritoVisible = false">✕</button>
        </div>
        <div class="carrito-items" *ngIf="carrito.length > 0">
          <div *ngFor="let item of carrito; let i = index" class="carrito-item">
            <div class="item-info">
              <span class="item-nombre">{{ item.nombreProducto }}</span>
              <span class="item-precio">\${{ item.precioUnitario | number:'1.0-0' }}</span>
            </div>
            <div class="item-controles">
              <button (click)="decrementarItem(i)">−</button>
              <span>{{ item.cantidad }}</span>
              <button (click)="incrementarItem(i)">+</button>
            </div>
          </div>
        </div>
        <div class="carrito-vacio" *ngIf="carrito.length === 0">
          <p>Tu carrito está vacío 🌮</p>
        </div>
        <div class="carrito-footer" *ngIf="carrito.length > 0">
          <div class="total-linea">
            <span>Total</span>
            <span class="total-precio">\${{ totalCarrito | number:'1.0-0' }}</span>
          </div>
          <button
            class="btn-confirmar"
            [disabled]="enviandoPedido"
            (click)="confirmarPedido()">
            {{ enviandoPedido ? 'Enviando a Cocina... 🍳' : '🚀 Confirmar Pedido' }}
          </button>
        </div>
      </div>

      <!-- Botón flotante del carrito -->
      <button class="btn-carrito-flotante" (click)="carritoVisible = !carritoVisible" *ngIf="carrito.length > 0">
        🛒 <span class="carrito-count">{{ totalItems }}</span>
      </button>

      <!-- Toast de confirmación -->
      <div class="toast-confirmacion" [class.visible]="toastVisible">
        ✅ ¡Pedido enviado a la cocina! RabbitMQ lo está procesando...
      </div>
    </div>
  `,
  styles: [`
    .menu-page {
      min-height: calc(100vh - 65px);
      padding: 2rem;
      background: #0f0f19;
      position: relative;
    }
    .menu-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .menu-title {
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 0.5rem;
    }
    .menu-subtitle {
      color: rgba(255,255,255,0.5);
      font-size: 0.9rem;
      margin: 0;
    }
    .loading-state {
      text-align: center;
      padding: 4rem;
      color: rgba(255,255,255,0.5);
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,149,0,0.2);
      border-top-color: #ff9500;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .categorias {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
      justify-content: center;
    }
    .btn-categoria {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.15);
      background: transparent;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-categoria.activa, .btn-categoria:hover {
      background: rgba(255, 149, 0, 0.15);
      border-color: #ff9500;
      color: #ff9500;
    }
    .productos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .producto-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .producto-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      border-color: rgba(255, 149, 0, 0.3);
    }
    .producto-card.agotado { opacity: 0.5; }
    .producto-imagen {
      position: relative;
      height: 180px;
      overflow: hidden;
    }
    .producto-imagen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .producto-card:hover .producto-imagen img { transform: scale(1.05); }
    .categoria-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.7);
      color: #ff9500;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255,149,0,0.3);
      text-transform: uppercase;
    }
    .stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(239, 68, 68, 0.85);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
    }
    .producto-info { padding: 1rem 1.2rem 1.2rem; }
    .producto-info h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.4rem;
    }
    .producto-desc {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
      margin: 0 0 1rem;
      line-height: 1.5;
    }
    .producto-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .producto-precio {
      font-size: 1.2rem;
      font-weight: 800;
      color: #ff9500;
    }
    .btn-agregar {
      background: linear-gradient(135deg, #ff9500, #ff6b00);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-agregar:hover { opacity: 0.9; transform: scale(1.03); }
    .btn-agregar:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: not-allowed; transform: none; }
    .carrito-panel {
      position: fixed;
      right: -380px;
      top: 65px;
      width: 360px;
      height: calc(100vh - 65px);
      background: rgba(20, 20, 35, 0.98);
      border-left: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      transition: right 0.3s ease;
      z-index: 900;
      padding: 1.5rem;
      box-shadow: -20px 0 60px rgba(0,0,0,0.5);
    }
    .carrito-panel.abierto { right: 0; }
    .carrito-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .carrito-header h3 { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0; }
    .btn-cerrar-carrito {
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      font-size: 1.1rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-cerrar-carrito:hover { color: #fff; }
    .carrito-items { flex: 1; overflow-y: auto; }
    .carrito-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .item-info { display: flex; flex-direction: column; gap: 2px; }
    .item-nombre { color: #fff; font-size: 0.85rem; font-weight: 600; }
    .item-precio { color: #ff9500; font-size: 0.8rem; font-weight: 700; }
    .item-controles {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #fff;
      font-weight: 600;
    }
    .item-controles button {
      width: 26px;
      height: 26px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }
    .carrito-vacio { text-align: center; color: rgba(255,255,255,0.4); padding: 3rem 0; }
    .carrito-footer { padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .total-linea {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
    }
    .total-precio { color: #ff9500; font-size: 1.3rem; font-weight: 800; }
    .btn-confirmar {
      width: 100%;
      background: linear-gradient(135deg, #ff9500, #ff6b00);
      color: #fff;
      border: none;
      padding: 12px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-confirmar:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-confirmar:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); cursor: not-allowed; transform: none; }
    .btn-carrito-flotante {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, #ff9500, #ff6b00);
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: 30px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(255,149,0,0.4);
      z-index: 800;
      transition: transform 0.2s ease;
    }
    .btn-carrito-flotante:hover { transform: scale(1.05); }
    .carrito-count {
      background: #fff;
      color: #ff6b00;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 900;
      margin-left: 4px;
    }
    .toast-confirmacion {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(34, 197, 94, 0.95);
      color: #fff;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: transform 0.3s ease;
      z-index: 1000;
      white-space: nowrap;
    }
    .toast-confirmacion.visible { transform: translateX(-50%) translateY(0); }
  `]
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
      const cats = new Set(productos.map(p => p.categoria || 'General'));
      this.categorias = ['Todas', ...Array.from(cats)];
      this.cargando = false;
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
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio,
        imagen: producto.imagen
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

  onImgError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
