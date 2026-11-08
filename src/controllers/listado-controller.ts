import type {ReactiveController, ReactiveControllerHost} from "lit";
import {ModeloBase} from "../models";

/**
 * Controller reutilizable para gestionar el filtrado de items inactivos
 * en componentes de listado.
 *
 * Encapsula el estado `mostrarInactivos` y la lógica de filtrado,
 * eliminando código repetido entre los componentes de listado.
 * Utiliza el método `esActivo()` de `ModeloBase` para determinar
 * si un item está activo.
 */
export class ListadoController implements ReactiveController {
  private host: ReactiveControllerHost;

  public mostrarInactivos = false;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    // No se requiere acción al conectar el host.
  }

  /**
   * Filtra los items según el estado de `mostrarInactivos`.
   * Usa el método `esActivo()` de cada modelo para determinar visibilidad.
   */
  getFilteredItems(items: ModeloBase[]): ModeloBase[] {
    return this.mostrarInactivos
      ? items
      : items.filter((item) => item.esActivo());
  }

  /**
   * Alterna la visibilidad de items inactivos.
   */
  toggleInactive(showInactive: boolean): void {
    this.mostrarInactivos = showInactive;
    this.host.requestUpdate();
  }
}
