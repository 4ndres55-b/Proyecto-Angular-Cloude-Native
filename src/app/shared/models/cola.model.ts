export interface ColaRequest {
  nombre: string;
  durable?: boolean;
  exclusiva?: boolean;
  autoDelete?: boolean;
}

export interface RespuestaAdmin {
  exitoso: boolean;
  mensaje: string;
  nombreCola: string;
  timestamp?: string;
}

export interface ColaInfo {
  existe: boolean;
  nombre: string;
  mensajesListos?: number;
  consumidoresActivos?: number;
  mensaje?: string;
}
