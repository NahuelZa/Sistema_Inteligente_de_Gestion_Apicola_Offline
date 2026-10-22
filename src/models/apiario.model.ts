export interface Apiario {
  id?: string;
  userId: string;
  nombre: string;
  ubicacion: string;
  notas: string;
  estado: 'activo' | 'inactivo';
  createdAtLocal?: string;
  createdAt?: string | any;
}
