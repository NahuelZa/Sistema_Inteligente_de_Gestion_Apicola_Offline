import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Componente que muestra un estado vacío cuando no hay registros.
 *
 * @attribute empty-icon - Nombre del icono de Webawesome.
 * @attribute empty-title - Título del mensaje vacío.
 * @attribute empty-description - Descripción del mensaje vacío.
 * @attribute no-active-text - Texto cuando no hay registros activos (en lugar de empty-title).
 * @attribute new-button-text - Texto del botón de crear.
 * @attribute new-button-test-id - Valor de data-testid del botón.
 * @attribute create-route - Ruta para navegar al hacer clic en crear.
 * @attribute [no-active] - Si está presente, usa no-active-text en lugar de empty-title.
 * @event listado-create - Disparado cuando se hace clic en el botón de crear.
 */
@customElement("listado-empty")
export class ListadoEmpty extends LitElement {

  @property({type: String}) emptyIcon = "cubes-stacked";
  @property({type: String}) emptyTitle = "No hay registros";
  @property({type: String}) emptyDescription = "";
  @property({type: String}) noActiveText = "No hay registros activos.";
  @property({type: String}) newButtonText = "Nuevo";
  @property({type: String}) newButtonTestId = "btn-nuevo";
  @property({type: String}) createRoute = "";
  @property({type: Boolean}) noActive = false;

  override createRenderRoot() {
    return this;
  }

  private handleCreate(): void {
    this.dispatchEvent(new CustomEvent('listado-create', {
      detail: { route: this.createRoute },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const title = this.noActive ? this.noActiveText : this.emptyTitle;

    return html`
      <wa-card appearance="filled-outlined">
        <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
          <wa-icon name="${this.emptyIcon}" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
          <div class="wa-stack wa-gap-2xs">
            <h3 class="wa-heading-m" style="margin: 0;">${title}</h3>
            <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">${this.emptyDescription}</p>
          </div>
          <wa-button
            id="${this.newButtonTestId}-empty"
            data-testid="${this.newButtonTestId}"
            variant="brand"
            appearance="accent"
            size="medium"
            @click=${this.handleCreate}
          >
            <wa-icon slot="start" name="circle-plus"></wa-icon>
            ${this.newButtonText}
          </wa-button>
        </div>
      </wa-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "listado-empty": ListadoEmpty;
  }
}
