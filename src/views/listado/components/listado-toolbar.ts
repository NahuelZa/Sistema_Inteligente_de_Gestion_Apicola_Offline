import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Barra de herramientas para listados con checkbox de inactivos y botón de crear.
 *
 * @attribute new-button-text - Texto del botón de crear.
 * @attribute new-button-test-id - Valor de data-testid del botón.
 * @attribute show-inactive-label - Etiqueta del checkbox de inactivos.
 * @attribute show-inactive-hint - Texto de ayuda del checkbox.
 * @attribute [show-inactive] - Si está presente, el checkbox aparece marcado.
 * @event listado-create - Disparado cuando se hace clic en el botón de crear.
 * @event listado-toggle-inactive - Disparado cuando cambia el estado del checkbox.
 */
@customElement("listado-toolbar")
export class ListadoToolbar extends LitElement {

  @property({type: String}) newButtonText = "Nuevo";
  @property({type: String}) newButtonTestId = "btn-nuevo";
  @property({type: String}) showInactiveLabel = "Mostrar inactivos";
  @property({type: String}) showInactiveHint = "";
  @property({type: Boolean}) showInactive = false;

  override createRenderRoot() {
    return this;
  }

  private handleCreate(): void {
    this.dispatchEvent(new CustomEvent('listado-create', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleToggleInactive(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.showInactive = checked;
    this.dispatchEvent(new CustomEvent('listado-toggle-inactive', {
      detail: { showInactive: checked },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    return html`
      <div class="wa-split wa-align-items-center">
        <wa-checkbox
          hint="${this.showInactiveHint}"
          ?checked=${this.showInactive}
          @change=${this.handleToggleInactive}
        >
          <wa-icon slot="start" name="eye"></wa-icon>
          ${this.showInactiveLabel}
        </wa-checkbox>
        <wa-button
          id="${this.newButtonTestId}"
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "listado-toolbar": ListadoToolbar;
  }
}
