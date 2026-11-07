import { ModeloBase } from "./modeloBase";
import { EstadoModelo } from "./index";

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

export class ApiarioModel extends ModeloBase {
  public nombre: string;
  public ubicacion: string;
  public notas: string;
  public estado: EstadoModelo;

  constructor(data: Apiario) {
    super();
    if (data.id) this.id = data.id;
    this.userId = data.userId;
    this.nombre = data.nombre;
    this.ubicacion = data.ubicacion;
    this.notas = data.notas;
    this.estado = data.estado;
    this.createdAtLocal = data.createdAtLocal;
    this.createdAt = data.createdAt;
  }

  public esActivo(): boolean {
    return this.estado === EstadoModelo.ACTIVO;
  }
}
