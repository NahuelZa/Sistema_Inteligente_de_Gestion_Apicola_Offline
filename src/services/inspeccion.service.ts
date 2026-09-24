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
}

export const inspeccionService = new InspeccionService();
