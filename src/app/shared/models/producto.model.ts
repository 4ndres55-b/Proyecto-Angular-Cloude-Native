export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
  categoria: string;
  urlImg?: string; 
}