import type {EstadoModelo} from "./index.ts";

export interface Colmena {
  id?: string;
  userId: string;
  apiarioId: string;
  numeroColmena: string;
  fechaAlta: string;
  estado: EstadoModelo;
  notas?: string;
  createdAtLocal?: string;
  createdAt?: string | any;
}
