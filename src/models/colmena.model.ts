export interface Colmena {
  id?: string;
  userId: string;
  apiarioId: string;
  numeroColmena: string;
  fechaAlta: string;
  estado?: "activa" | "inactiva";
  notas?: string;
  createdAtLocal?: string;
  createdAt?: string | any;
}
