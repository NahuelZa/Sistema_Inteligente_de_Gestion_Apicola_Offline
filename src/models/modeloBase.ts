/**
 * Clase base abstracta para todos los modelos de dominio.
 * Define el contrato común que todo modelo debe implementar para determinar
 * si se considera "activo" según su propia lógica de negocio.
 *
 * Esto resuelve el problema LSP donde `FirestoreService.getAllActivos()`
 * asumía que todo modelo tenía una propiedad `estado`, lo cual no era cierto
 * para modelos como `Inspeccion` que usan `anulada` en su lugar.
 */
export abstract class ModeloBase {
  public id!: string;
  public userId!: string;
  public createdAtLocal?: string;
  public createdAt?: string | any;
  public estaSincronizado?: boolean;

  /**
   * Determina si este modelo se considera activo según su lógica de negocio.
   * - Apiario/Colmena: verifica `estado === EstadoModelo.ACTIVO`
   * - Inspeccion: verifica `anulada !== true`
   * - HistorialTraslado: siempre activo (registro histórico)
   * @returns true si el modelo está activo, false en caso contrario.
   */
  public abstract esActivo(): boolean;

  /**
   * Marca el modelo como sincronizado o no sincronizado con Firestore.
   * @param sincronizado true si el modelo está sincronizado, false si tiene cambios pendientes.
   */
  public marcarComoSincronizado(sincronizado: boolean): void {
    this.estaSincronizado = sincronizado;
  }
}
