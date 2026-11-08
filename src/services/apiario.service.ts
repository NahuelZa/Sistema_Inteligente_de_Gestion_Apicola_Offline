import { FirestoreService } from "./FirestoreService";
import type { Apiario } from "../models";
import { ApiarioModel, ColmenaModel, ModeloBase, EstadoModelo } from "../models";
import { COLLECTIONS } from "../constants";
import { colmenaService } from "./colmena.service";

export class ApiarioService extends FirestoreService<Apiario> {
  constructor() {
    super(COLLECTIONS.APIARIOS);
  }

  protected createModel(raw: Apiario & { id: string }): ModeloBase {
    return new ApiarioModel(raw);
  }

  /**
   * Inactiva un apiario sin borrarlo físicamente (soft-delete).
   * Preserva las colmenas e inspecciones históricas asociadas.
   * No permite inactivar si el apiario aún tiene colmenas activas.
   * @param id Identificador del apiario a inactivar.
   */
  public async inactivar(id: string): Promise<void> {
    const colmenasActivas = await colmenaService.getAllActivos();
    const tieneColmenasActivas = colmenasActivas.some(c => (c as ColmenaModel).apiarioId === id);
    if (tieneColmenasActivas) {
      throw new Error("No se puede archivar el apiario mientras tenga colmenas activas.");
    }
    await this.update(id, { estado: EstadoModelo.INACTIVO });
  }

  /**
   * Reactiva un apiario previamente inactivado.
   * @param id Identificador del apiario a reactivar.
   */
  public async reactivar(id: string): Promise<void> {
    await this.update(id, { estado: EstadoModelo.ACTIVO });
  }
}

export const apiarioService = new ApiarioService();
