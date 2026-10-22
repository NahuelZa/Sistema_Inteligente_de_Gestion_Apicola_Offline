import { FirestoreService } from "./FirestoreService";
import type { Colmena } from "../models";
import { COLLECTIONS } from "../constants";

export class ColmenaService extends FirestoreService<Colmena> {
  constructor() {
    super(COLLECTIONS.COLMENAS);
  }

  /**
   * Inactiva una colmena sin borrarla físicamente (soft-delete).
   * Preserva el historial de inspecciones asociadas.
   * @param id Identificador de la colmena a inactivar.
   */
  public async inactivar(id: string): Promise<void> {
    await this.update(id, { estado: 'inactiva' });
  }

  /**
   * Reactiva una colmena previamente inactivada.
   * @param id Identificador de la colmena a reactivar.
   */
  public async reactivar(id: string): Promise<void> {
    await this.update(id, { estado: 'activa' });
  }
}

export const colmenaService = new ColmenaService();
