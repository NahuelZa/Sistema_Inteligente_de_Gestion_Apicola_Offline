import { FirestoreService } from "./FirestoreService";
import type { HistorialTraslado } from "../models";
import { HistorialTrasladoModel, ModeloBase } from "../models";
import { COLLECTIONS } from "../constants";

export class TrasladoService extends FirestoreService<HistorialTraslado> {
  constructor() {
    super(COLLECTIONS.HISTORIAL_TRASLADOS);
  }

  protected createModel(raw: HistorialTraslado & { id: string }): ModeloBase {
    return new HistorialTrasladoModel(raw);
  }

  /**
   * Obtiene todos los traslados registrados para una colmena específica.
   * @param colmenaId Identificador de la colmena.
   * @returns Lista de traslados ordenados por fecha.
   */
  public async getTrasladosPorColmena(colmenaId: string): Promise<HistorialTrasladoModel[]> {
    const all = await this.getAll();
    const filtered: HistorialTrasladoModel[] = all
      .filter((t) => (t as HistorialTrasladoModel).colmenaId === colmenaId) as any;
    return filtered.sort(
      (a, b) => b.fecha.localeCompare(a.fecha)
    );
  }

}

export const trasladoService = new TrasladoService();
