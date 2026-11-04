export interface HistorialTraslado {
  id?: string;
  userId?: string;
  colmenaId: string;
  numeroColmena?: string;
  apiarioOrigenId: string;
  apiarioDestinoId: string;
  fecha: string;
  motivo: string;
  notas?: string;
  createdAtLocal: string;
}
