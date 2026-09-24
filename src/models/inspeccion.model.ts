export interface Inspeccion {
  id?: string;
  userId: string;
  colmenaId: string;
  apiarioId?: string;
  fecha: string;
  poblacion: "baja" | "media" | "alta";
  reinaVista: boolean;
  tienePostura: boolean;
  estadoSanitario: "bueno" | "alerta" | "enferma";
  enfermedadesDetectadas?: string;
  notas?: string;
  createdAtLocal: string;
  createdAt?: string | any;
}
