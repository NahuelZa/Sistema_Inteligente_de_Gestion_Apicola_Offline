import { FirestoreService } from "./FirestoreService";
import type { Apiario } from "../models/apiario.model";
import { COLLECTIONS } from "../constants";

export class ApiarioService extends FirestoreService<Apiario> {
  constructor() {
    super(COLLECTIONS.APIARIOS);
  }

  /**
   * Inactiva un apiario sin borrarlo físicamente (soft-delete).
   * Preserva las colmenas e inspecciones históricas asociadas.
   * @param id Identificador del apiario a inactivar.
   */
  public async inactivar(id: string): Promise<void> {
    await this.update(id, { estado: 'inactivo' });
  }

  /**
   * Reactiva un apiario previamente inactivado.
   * @param id Identificador del apiario a reactivar.
   */
  public async reactivar(id: string): Promise<void> {
    await this.update(id, { estado: 'activo' });
  }
}

export const apiarioService = new ApiarioService();
