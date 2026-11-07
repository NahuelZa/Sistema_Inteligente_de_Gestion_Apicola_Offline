import {html, LitElement, nothing, type TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import "./listado-empty";
import "./listado-toolbar";

export interface ListadoLayoutConfig {
  /** Icono para el estado vacío. */
  emptyIcon: string;
  /** Título cuando no hay items en absoluto. */
  emptyTitle: string;
  /** Descripción cuando no hay items en absoluto. */
  emptyDescription: string;
  /** Texto cuando no hay items activos. */
  noActiveText: string;
  /** Texto del botón de crear. */
  newButtonText: string;
  /** data-testid del botón de crear. */
  newButtonTestId: string;
  /** Etiqueta del checkbox de inactivos. */
  showInactiveLabel: string;
  /** Texto de ayuda del checkbox. */
  showInactiveHint: string;
}

/**
 * Componente que encapsula la lógica de render compartido entre listados:
 * estado vacío total, sin activos, y caso normal con toolbar + items.
 *
 * El componente padre pasa los items filtrados y una función renderItem;
 * este componente decide qué rama mostrar y renderiza los items en el caso normal.
 *
 * @event listado-create - Disparado cuando se hace clic en el botón de crear.
 * @event listado-toggle-inactive - Disparado cuando cambia el estado del checkbox.
 */
@customElement("listado-layout")
export class ListadoLayout extends LitElement {

  @property({type: Object}) config: ListadoLayoutConfig | null = null;

  /** Items filtrados (activos o todos, según showInactive). */
  @property({type: Array}) filteredItems: unknown[] = [];

  /** Total de items sin filtrar. */
  @property({type: Number}) totalItems = 0;

  /** Si el checkbox de inactivos está marcado. */
  @property({type: Boolean}) showInactive = false;

  /** Función que recibe un item y devuelve su template. */
  @property({type: Function}) renderItem: ((item: unknown) => TemplateResult) | null = null;

  override createRenderRoot() {
    return this;
  }

  private handleCreate(): void {
    this.dispatchEvent(new CustomEvent('listado-create', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleToggleInactive(e: CustomEvent): void {
    this.showInactive = e.detail.showInactive;
    this.dispatchEvent(new CustomEvent('listado-toggle-inactive', {
      detail: { showInactive: e.detail.showInactive },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    if (!this.config) return nothing;

    const {
      emptyIcon,
      emptyTitle,
      emptyDescription,
      noActiveText,
      newButtonText,
      newButtonTestId,
      showInactiveLabel,
      showInactiveHint,
    } = this.config;

    // Si no hay items en absoluto, mostrar estado vacío
    if (this.totalItems === 0) {
      return html`
        <listado-empty
          .emptyIcon=${emptyIcon}
          .emptyTitle=${emptyTitle}
          .emptyDescription=${emptyDescription}
          .newButtonText=${newButtonText}
          .newButtonTestId=${newButtonTestId}
          @listado-create=${this.handleCreate}
        ></listado-empty>
      `;
    }

    // Si no hay activos y el checkbox no está marcado, mostrar toolbar + empty sin activos
    if (this.filteredItems.length === 0 && !this.showInactive) {
      return html`
        <listado-toolbar
          .newButtonText=${newButtonText}
          .newButtonTestId=${newButtonTestId}
          .showInactiveLabel=${showInactiveLabel}
          .showInactiveHint=${showInactiveHint}
          @listado-create=${this.handleCreate}
          @listado-toggle-inactive=${this.handleToggleInactive}
        ></listado-toolbar>
        <listado-empty
          .emptyIcon=${emptyIcon}
          .noActiveText=${noActiveText}
          .newButtonText=${newButtonText}
          .newButtonTestId=${newButtonTestId}
          .noActive=${true}
          @listado-create=${this.handleCreate}
        ></listado-empty>
      `;
    }

    return html`
      <listado-toolbar
        .newButtonText=${newButtonText}
        .newButtonTestId=${newButtonTestId}
        .showInactiveLabel=${showInactiveLabel}
        .showInactiveHint=${showInactiveHint}
        .showInactive=${this.showInactive}
        @listado-create=${this.handleCreate}
        @listado-toggle-inactive=${this.handleToggleInactive}
      ></listado-toolbar>
      <div class="wa-stack wa-gap-m">
        ${this.filteredItems.map((item) => this.renderItem!(item))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "listado-layout": ListadoLayout;
  }
}
