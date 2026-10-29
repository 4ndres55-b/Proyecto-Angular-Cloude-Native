import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Producto } from '../../shared/models/producto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  // Nueva ruta del BFF que conecta con el ms-catalogo
  private apiUrl = `${environment.bffUrl}/api/bff/productos`;

  constructor(private http: HttpClient) {}

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      map(productos => productos.map(p => {
        if (p.urlImg) {
          p.urlImg = p.urlImg.replace('/uploads/', `${this.apiUrl}/uploads/`);
        }
        return p;
      }))
    );
  }

  agregarProducto(producto: Producto, imagen?: File): Observable<Producto> {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('precio', producto.precio.toString());
    formData.append('stock', producto.stock.toString());
    formData.append('descripcion', producto.descripcion);
    formData.append('categoria', producto.categoria);
    
    if (imagen) {
      formData.append('imagen', imagen);
    }


    return this.http.post<Producto>(this.apiUrl, formData);
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}