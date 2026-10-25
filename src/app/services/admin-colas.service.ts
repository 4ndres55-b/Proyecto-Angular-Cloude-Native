import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ColaRequest, RespuestaAdmin, ColaInfo } from '../models/cola.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminColasService {
  private apiUrl = `${environment.adminUrl}/colas`;

  constructor(private http: HttpClient) {}

  crearCola(request: ColaRequest): Observable<RespuestaAdmin> {
    return this.http.post<RespuestaAdmin>(this.apiUrl, request).pipe(
      catchError((error) => {
        console.error('Error al crear cola en el Administrador:', error);
        return of({ exitoso: false, mensaje: 'Error de conexión con el microservicio Administrador (8084). ¿Está RabbitMQ levantado?', nombreCola: request.nombre });
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
}
