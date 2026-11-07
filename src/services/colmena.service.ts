import { FirestoreService } from "./FirestoreService";
import { type Colmena, ColmenaModel, ModeloBase, EstadoModelo } from "../models";
import { COLLECTIONS } from "../constants";
import { writeBatch, doc, collection, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { authService } from "./auth.service";

export interface RegistrarTrasladoDTO {
  colmenaId: string;
  apiarioOrigenId: string;
  apiarioDestinoId: string;
  fecha: string;
  motivo: string;
  notas?: string;
}

export interface RegistrarTrasladoBatchDTO {
  colmenas: Array<{ colmenaId: string; apiarioOrigenId: string }>;
  apiarioDestinoId: string;
  fecha: string;
  motivo: string;
  notas?: string;
}

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

  /**
   * Ejecuta un traslado atómico de una colmena entre apiarios.
   * En una sola operación `writeBatch`:
   * 1. Crea el registro en `historial_traslados`.
   * 2. Actualiza el `apiarioId` en `colmenas`.
   * @param dto Datos del traslado a registrar.
   */
  public async trasladarColmena(dto: RegistrarTrasladoDTO): Promise<void> {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    if (dto.apiarioOrigenId === dto.apiarioDestinoId) {
      throw new Error("El apiario de destino debe ser diferente al de origen.");
    }

    // Leer la colmena para obtener el número
    const colmenaRef = doc(db, COLLECTIONS.COLMENAS, dto.colmenaId);
    const colmenaSnap = await getDoc(colmenaRef);
    if (!colmenaSnap.exists()) {
      throw new Error("La colmena no existe.");
    }
    const colmenaData = colmenaSnap.data() as Colmena;
    if (colmenaData.apiarioId !== dto.apiarioOrigenId) {
      throw new Error("El apiario de origen no coincide con la ubicación actual de la colmena.");
    }

    const batch = writeBatch(db);

    // 1. Referencia y datos del nuevo registro en 'historial_traslados'
    const trasladoRef = doc(collection(db, COLLECTIONS.HISTORIAL_TRASLADOS));
    const trasladoData = {
      userId,
      colmenaId: dto.colmenaId,
      numeroColmena: colmenaData.numeroColmena,
      apiarioOrigenId: dto.apiarioOrigenId,
      apiarioDestinoId: dto.apiarioDestinoId,
      fecha: dto.fecha,
      motivo: dto.motivo,
      notas: dto.notas || '',
      createdAtLocal: new Date().toISOString()
    };
    batch.set(trasladoRef, trasladoData);

    // 2. Referencia y actualización de ubicación en 'colmenas'
    batch.update(colmenaRef, {
      apiarioId: dto.apiarioDestinoId,
      updatedAtLocal: new Date().toISOString()
    });

    // 3. Confirmación atómica en lote
    await batch.commit();
  }

  /**
   * Ejecuta un traslado atómico de múltiples colmenas a un mismo apiario de destino.
   * En una sola operación `writeBatch`:
   * 1. Crea los registros en `historial_traslados` para cada colmena.
   * 2. Actualiza el `apiarioId` en `colmenas` para cada colmena.
   * @param dto Datos del traslado en lote.
   */
  public async trasladarColmenas(dto: RegistrarTrasladoBatchDTO): Promise<void> {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    if (dto.colmenas.length === 0) {
      throw new Error("No hay colmenas para trasladar.");
    }

    // Validar y leer todas las colmenas antes del batch
    const colmenasData: Array<{ id: string; numeroColmena: string; apiarioOrigenId: string }> = [];
    for (const c of dto.colmenas) {
      const colmenaRef = doc(db, COLLECTIONS.COLMENAS, c.colmenaId);
      const colmenaSnap = await getDoc(colmenaRef);
      if (!colmenaSnap.exists()) {
        throw new Error(`La colmena ${c.colmenaId} no existe.`);
      }
      const colmenaData = colmenaSnap.data() as Colmena;
      if (colmenaData.apiarioId !== c.apiarioOrigenId) {
        throw new Error(`El apiario de origen no coincide con la ubicación actual de la colmena ${colmenaData.numeroColmena}.`);
      }
      if (colmenaData.apiarioId === dto.apiarioDestinoId) {
        throw new Error(`La colmena ${colmenaData.numeroColmena} ya se encuentra en el apiario de destino.`);
      }
      colmenasData.push({
        id: c.colmenaId,
        numeroColmena: colmenaData.numeroColmena,
        apiarioOrigenId: c.apiarioOrigenId,
      });
    }

    const batch = writeBatch(db);

    for (const c of colmenasData) {
      // 1. Referencia y datos del nuevo registro en 'historial_traslados'
      const trasladoRef = doc(collection(db, COLLECTIONS.HISTORIAL_TRASLADOS));
      const trasladoData = {
        userId,
        colmenaId: c.id,
        numeroColmena: c.numeroColmena,
        apiarioOrigenId: c.apiarioOrigenId,
        apiarioDestinoId: dto.apiarioDestinoId,
        fecha: dto.fecha,
        motivo: dto.motivo,
        notas: dto.notas || '',
        createdAtLocal: new Date().toISOString()
      };
      batch.set(trasladoRef, trasladoData);

      // 2. Actualización de ubicación en 'colmenas'
      const colmenaRef = doc(db, COLLECTIONS.COLMENAS, c.id);
      batch.update(colmenaRef, {
        apiarioId: dto.apiarioDestinoId,
        updatedAtLocal: new Date().toISOString()
      });
    }

    // 3. Confirmación atómica en lote
    await batch.commit();
  }
}

export const colmenaService = new ColmenaService();
