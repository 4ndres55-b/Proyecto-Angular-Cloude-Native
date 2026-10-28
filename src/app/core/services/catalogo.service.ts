import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Producto } from '../../shared/models/producto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private apiUrl = `${environment.bffUrl}/api/productos`;

  // Productos gastronómicos de respaldo con temática de restaurante Cloud Native
  private productosMock: Producto[] = [
    {
      id: 1,
      nombre: 'Cloud Burger Deluxe',
      descripcion: 'Doble carne angus, queso cheddar fundido, tocino crocante y salsa secreta 360.',
      precio: 8500,
      categoria: 'Hamburguesas',
      imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      stock: 25
    },
    {
      id: 2,
      nombre: 'Pizza Artesanal Napolitana',
      descripcion: 'Masa madre fermentada 48 hrs, salsa pomodoro, mozzarella di bufala y albahaca fresca.',
      precio: 10900,
      categoria: 'Pizzas',
      imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      stock: 18
    },
    {
      id: 3,
      nombre: 'Smoked BBQ Ribs Burger',
      descripcion: 'Costillar desmenuzado en salsa BBQ ahumada, cebolla caramelizada y coleslaw.',
      precio: 9200,
      categoria: 'Hamburguesas',
      imagen: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
      stock: 15
    },
    {
      id: 4,
      nombre: 'Papas Rústicas Trufadas',
      descripcion: 'Papas doradas al romero, bañadas en aceite de trufa y parmesano rallado.',
      precio: 4900,
      categoria: 'Acompañamientos',
      imagen: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
      stock: 30
    },
    {
      id: 5,
      nombre: 'Combo RabbitMQ Duo',
      descripcion: '2 Cloud Burgers + Papas Rústicas familiares + 2 Bebidas artesanales.',
      precio: 19990,
      categoria: 'Combos',
      imagen: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&w=600&q=80',
      stock: 10
    },
    {
      id: 6,
      nombre: 'Bebida Artesanal Berries',
      descripcion: 'Limonada fresca con infusión de frutos del bosque y hojas de menta.',
      precio: 3200,
      categoria: 'Bebidas',
      imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      stock: 40
    }
  ];

  constructor(private http: HttpClient) {}

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((items) => {
        if (!items || items.length === 0) {
          return this.productosMock;
        }
        return items.map((item, index) => ({
          id: item.id || index + 1,
          nombre: item.nombre || 'Plato Gourmet',
          descripcion: item.descripcion || 'Preparado con ingredientes frescos de la estación.',
          precio: Number(item.precio) || 7500,
          categoria: item.categoria || 'Especialidades',
          imagen: item.imagen || this.productosMock[index % this.productosMock.length].imagen,
          stock: item.stock || 20
        }));
      }),
      catchError((error) => {
        console.warn('BFF no disponible o error al conectar con AWS RDS. Usando catálogo local:', error);
        return of(this.productosMock);
      })
    );
  }
}
