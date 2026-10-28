import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetallePedido } from '../../../shared/models/pedido.model';

export interface ItemCarrito extends DetallePedido {
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
  @Input() carrito: ItemCarrito[] = [];
  @Input() carritoVisible = false;
  @Input() enviandoPedido = false;
  @Input() totalCarrito = 0;
  @Input() totalItems = 0;

  @Output() toggleVisibility = new EventEmitter<void>();
  @Output() incrementar = new EventEmitter<number>();
  @Output() decrementar = new EventEmitter<number>();
  @Output() confirmar = new EventEmitter<void>();
}