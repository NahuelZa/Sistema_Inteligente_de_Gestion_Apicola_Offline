import type {EstadoModelo} from "./index.ts";

export interface Apiario {
  id?: string;
  userId: string;
  nombre: string;
  ubicacion: string;
  notas: string;
  estado: EstadoModelo;
  createdAtLocal?: string;
  createdAt?: string | any;
}
