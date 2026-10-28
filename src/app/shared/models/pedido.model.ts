export interface DetallePedido {
  id?: number;
  productoId: number;
  nombreProducto?: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id?: number;
  username: string;
  estado: string;
  total: number;
  detalles: DetallePedido[];
  fechaCreacion?: string;
}
