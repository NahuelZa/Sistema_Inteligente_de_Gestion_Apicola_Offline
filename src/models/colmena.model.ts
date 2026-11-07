import { ModeloBase } from "./modeloBase";
import { EstadoModelo } from "./index";

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

export class ColmenaModel extends ModeloBase {
  public apiarioId: string;
  public numeroColmena: string;
  public fechaAlta: string;
  public estado: EstadoModelo;
  public notas?: string;

  constructor(data: Colmena) {
    super();
    if (data.id) this.id = data.id;
    this.userId = data.userId;
    this.apiarioId = data.apiarioId;
    this.numeroColmena = data.numeroColmena;
    this.fechaAlta = data.fechaAlta;
    this.estado = data.estado;
    this.notas = data.notas;
    this.createdAtLocal = data.createdAtLocal;
    this.createdAt = data.createdAt;
  }

  public esActivo(): boolean {
    return this.estado === EstadoModelo.ACTIVO;
  }
}
