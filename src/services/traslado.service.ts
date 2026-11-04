import { FirestoreService } from "./FirestoreService";
import type { HistorialTraslado } from "../models";
import { COLLECTIONS } from "../constants";

export class TrasladoService extends FirestoreService<HistorialTraslado> {
  constructor() {
    super(COLLECTIONS.HISTORIAL_TRASLADOS);
  }

  /**
   * Obtiene todos los traslados registrados para una colmena específica.
   * @param colmenaId Identificador de la colmena.
   * @returns Lista de traslados ordenados por fecha.
   */
  public async getTrasladosPorColmena(colmenaId: string): Promise<HistorialTraslado[]> {
    const all = await this.getAll();
    return all
      .filter((t) => t.colmenaId === colmenaId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

}

export const trasladoService = new TrasladoService();
