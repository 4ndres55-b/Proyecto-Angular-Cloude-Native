import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ColaRequest, RespuestaAdmin, ColaInfo } from '../../shared/models/cola.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminColasService {
  private apiUrl = `${environment.adminUrl}/colas`;

  constructor(private http: HttpClient) {}

  crearCola(request: ColaRequest): Observable<RespuestaAdmin> {
    return this.http.post<RespuestaAdmin>(this.apiUrl, request).pipe(
      catchError((error) => {
        console.error('Error crudo devuelto por el servidor:', error);
        
        let mensajeError = 'Error de conexión con el microservicio Administrador.';
        if (error.error && error.error.error) {
            mensajeError = error.error.error; 
            if (error.error.detalles) {
                const primerError = Object.values(error.error.detalles)[0];
                mensajeError += ': ' + primerError;
            } else if (error.error.mensaje) {
                mensajeError += ' -> ' + error.error.mensaje;
            }
          }
        
        return of({ 
            exitoso: false, 
            mensaje: mensajeError, 
            nombreCola: request.nombre 
        });
      })
    );
  }

  eliminarCola(nombre: string): Observable<RespuestaAdmin> {
    return this.http.delete<RespuestaAdmin>(`${this.apiUrl}/${nombre}`).pipe(
      catchError((error) => {
        console.error('Error al eliminar cola:', error);
        return of({ exitoso: false, mensaje: 'Error de conexión con el microservicio Administrador.', nombreCola: nombre });
      })
    );
  }

  consultarCola(nombre: string): Observable<ColaInfo> {
    return this.http.get<ColaInfo>(`${this.apiUrl}/${nombre}`).pipe(
      catchError((error) => {
        console.error('Error al consultar cola:', error);
        return of({ existe: false, nombre, mensaje: 'No se pudo conectar con el broker RabbitMQ.' });
      })
    );
  }

  listarColas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error al obtener el listado de colas:', error);
        return of([]);
      })
    );
  }

  leerMensajes(nombreCola: string, cantidad: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${nombreCola}/mensajes?count=${cantidad}`).pipe(
      catchError((error) => {
        console.error(`Error al leer mensajes de ${nombreCola}:`, error);
        return of([]);
      })
    );
  }
}