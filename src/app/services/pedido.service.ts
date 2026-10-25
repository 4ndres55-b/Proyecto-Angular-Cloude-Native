import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Pedido } from '../models/pedido.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = `${environment.bffUrl}/api/pedidos`;

  private pedidosMock: Pedido[] = [
    {
      id: 1,
      username: 'ni.sanmartina@duocuc.cl',
      estado: 'CREADO',
      total: 8500,
      detalles: [{ productoId: 1, nombreProducto: 'Cloud Burger Deluxe', cantidad: 1, precioUnitario: 8500 }]
    },
    {
      id: 2,
      username: 'ni.sanmartina@duocuc.cl',
      estado: 'EN_PREPARACION',
      total: 14100,
      detalles: [{ productoId: 2, nombreProducto: 'Pizza Artesanal', cantidad: 1, precioUnitario: 10900 }, { productoId: 6, nombreProducto: 'Bebida Artesanal', cantidad: 1, precioUnitario: 3200 }]
    },
    {
      id: 3,
      username: 'ni.sanmartina@duocuc.cl',
      estado: 'LISTO',
      total: 19990,
      detalles: [{ productoId: 5, nombreProducto: 'Combo RabbitMQ Duo', cantidad: 1, precioUnitario: 19990 }]
    }
  ];

  constructor(private http: HttpClient, private authService: AuthService) {}

  obtenerPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.warn('BFF no disponible. Usando pedidos locales de demostración:', error);
        return of(this.pedidosMock);
      })
    );
  }

  crearPedido(pedido: Partial<Pedido>): Observable<Pedido> {
    const nuevoPedido: Pedido = {
      username: this.authService.getUsername(),
      estado: 'CREADO',
      total: pedido.total || 0,
      detalles: pedido.detalles || []
    };

    return this.http.post<Pedido>(this.apiUrl, nuevoPedido).pipe(
      catchError((error) => {
        console.warn('Error al crear pedido en el servidor. Modo demo:', error);
        const mockRespuesta: Pedido = {
          id: Math.floor(Math.random() * 1000) + 100,
          ...nuevoPedido
        };
        return of(mockRespuesta);
      })
    );
  }
}
