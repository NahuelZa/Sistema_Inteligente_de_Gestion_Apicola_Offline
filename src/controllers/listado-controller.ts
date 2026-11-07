import type {ReactiveController, ReactiveControllerHost} from "lit";

export interface ListadoControllerOptions<T> {
  /**
   * Función que determina si un item está inactivo.
   */
  isInactive: (item: T) => boolean;
}

/**
 * Controller reutilizable para gestionar el filtrado de items inactivos
   * en componentes de listado.
   *
   * Encapsula el estado `mostrarInactivos` y la lógica de filtrado,
   * eliminando código repetido entre los componentes de listado.
   */
export class ListadoController<T> implements ReactiveController {
  private host: ReactiveControllerHost;
  private isInactiveFn: (item: T) => boolean;

  public mostrarInactivos = false;

  constructor(host: ReactiveControllerHost, options: ListadoControllerOptions<T>) {
    this.host = host;
    this.isInactiveFn = options.isInactive;
    host.addController(this);
  }

  hostConnected(): void {
    // No se requiere acción al conectar el host.
  }

  /**
   * Filtra los items según el estado de `mostrarInactivos`.
   */
  getFilteredItems(items: T[]): T[] {
    return this.mostrarInactivos
      ? items
      : items.filter((item) => !this.isInactiveFn(item));
  }

  /**
   * Alterna la visibilidad de items inactivos.
   */
  toggleInactive(showInactive: boolean): void {
    this.mostrarInactivos = showInactive;
    this.host.requestUpdate();
  }
}
