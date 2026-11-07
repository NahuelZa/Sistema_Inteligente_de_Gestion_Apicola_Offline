import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

/**
 * Componente que muestra un estado de carga (pending) con spinner y texto.
 *
 * @attribute loading-text - Texto mostrado mientras se cargan los datos.
 */
@customElement("listado-pending")
export class ListadoPending extends LitElement {

  @property({type: String}) loadingText = "Cargando...";

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <div class="wa-stack wa-align-items-center wa-gap-m" style="padding: var(--wa-space-2xl) var(--wa-space-l);">
        <wa-spinner style="font-size: 2.5rem; --indicator-color: var(--wa-color-brand);"></wa-spinner>
        <span class="wa-body-s wa-color-text-quiet">${this.loadingText}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "listado-pending": ListadoPending;
  }
}
