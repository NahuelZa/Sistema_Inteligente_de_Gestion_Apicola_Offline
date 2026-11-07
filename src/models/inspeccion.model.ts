import { ModeloBase } from "./modeloBase";

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
  enfermedadesDetectadas: string;
  notas?: string;
  anulada?: boolean;
  motivoAnulacion?: string;
  anuladaAt?: string;
  createdAtLocal: string;
  createdAt?: string | any;
}

export class InspeccionModel extends ModeloBase {
  public colmenaId: string;
  public apiarioId?: string;
  public fecha: string;
  public poblacion: "baja" | "media" | "alta";
  public reinaVista: boolean;
  public tienePostura: boolean;
  public estadoSanitario: "bueno" | "alerta" | "enferma";
  public enfermedadesDetectadas: string;
  public notas?: string;
  public anulada?: boolean;
  public motivoAnulacion?: string;
  public anuladaAt?: string;

  constructor(data: Inspeccion) {
    super();
    if (data.id) this.id = data.id;
    this.userId = data.userId;
    this.colmenaId = data.colmenaId;
    this.apiarioId = data.apiarioId;
    this.fecha = data.fecha;
    this.poblacion = data.poblacion;
    this.reinaVista = data.reinaVista;
    this.tienePostura = data.tienePostura;
    this.estadoSanitario = data.estadoSanitario;
    this.enfermedadesDetectadas = data.enfermedadesDetectadas;
    this.notas = data.notas;
    this.anulada = data.anulada;
    this.motivoAnulacion = data.motivoAnulacion;
    this.anuladaAt = data.anuladaAt;
    this.createdAtLocal = data.createdAtLocal;
    this.createdAt = data.createdAt;
  }

  public esActivo(): boolean {
    return this.anulada !== true;
  }
}
