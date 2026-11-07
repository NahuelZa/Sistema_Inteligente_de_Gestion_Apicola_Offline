import { ModeloBase } from "./modeloBase";

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

export class HistorialTrasladoModel extends ModeloBase {
  public colmenaId: string;
  public numeroColmena?: string;
  public apiarioOrigenId: string;
  public apiarioDestinoId: string;
  public fecha: string;
  public motivo: string;
  public notas?: string;

  constructor(data: HistorialTraslado) {
    super();
    if (data.id) this.id = data.id;
    this.userId = data.userId || '';
    this.colmenaId = data.colmenaId;
    this.numeroColmena = data.numeroColmena;
    this.apiarioOrigenId = data.apiarioOrigenId;
    this.apiarioDestinoId = data.apiarioDestinoId;
    this.fecha = data.fecha;
    this.motivo = data.motivo;
    this.notas = data.notas;
    this.createdAtLocal = data.createdAtLocal;
  }

  public esActivo(): boolean {
    return true;
  }
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
