import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../shared/models/producto.model';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.css']
})
export class ProductoCardComponent {
  @Input() producto!: Producto;
  @Output() agregar = new EventEmitter<Producto>();

  onImgError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
  }
}