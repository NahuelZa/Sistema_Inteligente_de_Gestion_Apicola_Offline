import { FirestoreService } from "./FirestoreService";
import type { Inspeccion } from "../models";
import { COLLECTIONS } from "../constants";

/**
 * Servicio para gestión y persistencia de inspecciones de colmenas.
 * Sigue el patrón Append-Only: cada inspección es un registro histórico nuevo e inmutable con UUID local.
 */
export class InspeccionService extends FirestoreService<Inspeccion> {
  constructor() {
    super(COLLECTIONS.INSPECCIONES);
  }

  /**
   * Anula una inspección marcándola como anulada sin borrarla físicamente (soft-delete).
   * Preserva la trazabilidad histórica del registro sanitario.
   * @param id Identificador de la inspección a anular.
   * @param motivo Motivo de la anulación.
   */
  public async anularInspeccion(id: string, motivo: string): Promise<void> {
    await this.update(id, {
      anulada: true,
      motivoAnulacion: motivo,
      anuladaAt: new Date().toISOString(),
    });
  }
}

export const inspeccionService = new InspeccionService();
