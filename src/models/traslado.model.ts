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

export interface MotivoTraslado {
  value: string;
  label: string;
}

export const MOTIVOS_TRASLADO: MotivoTraslado[] = [
  { value: "floracion", label: "Floración / Trashumancia" },
  { value: "sanidad", label: "Sanidad / Aislamiento" },
  { value: "fusion", label: "Fusión de colmenares" },
  { value: "espacio", label: "Optimización de espacio" },
  { value: "otro", label: "Otro" },
];
