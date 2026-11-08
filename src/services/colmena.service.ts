import { FirestoreService } from "./FirestoreService";
import { type Colmena, ColmenaModel, ModeloBase, EstadoModelo } from "../models";
import { COLLECTIONS } from "../constants";

export class ColmenaService extends FirestoreService<Colmena> {
  constructor() {
    super(COLLECTIONS.COLMENAS);
  }

  protected createModel(raw: Colmena & { id: string }): ModeloBase {
    return new ColmenaModel(raw);
  }

  /**
   * Inactiva una colmena sin borrarla físicamente (soft-delete).
   * Preserva el historial de inspecciones asociadas.
   * @param id Identificador de la colmena a inactivar.
   */
  public async inactivar(id: string): Promise<void> {
    await this.update(id, { estado: EstadoModelo.INACTIVO });
  }

  /**
   * Reactiva una colmena previamente inactivada.
   * @param id Identificador de la colmena a reactivar.
   */
  public async reactivar(id: string): Promise<void> {
    await this.update(id, { estado: EstadoModelo.ACTIVO });
  }
}

export const colmenaService = new ColmenaService();
