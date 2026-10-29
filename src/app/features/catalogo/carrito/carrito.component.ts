import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ItemCarrito {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  imagen?: string;
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent {
  // Inputs que recibe desde menu.component.html
  @Input() carrito: ItemCarrito[] = [];
  @Input() carritoVisible = false;
  @Input() enviandoPedido = false;
  @Input() totalCarrito = 0;
  @Input() totalItems = 0;

  // Eventos que envía hacia menu.component.ts
  @Output() toggleVisibility = new EventEmitter<void>();
  @Output() incrementar = new EventEmitter<number>();
  @Output() decrementar = new EventEmitter<number>();
  @Output() confirmar = new EventEmitter<void>();
}