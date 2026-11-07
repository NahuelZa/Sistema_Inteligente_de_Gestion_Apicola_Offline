import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Componente que muestra un estado de error con opción de reintentar.
 *
 * @attribute error-icon - Nombre del icono de Webawesome.
 * @attribute error-title - Título del mensaje de error.
 * @attribute error-description - Descripción del mensaje de error.
 * @event listado-retry - Disparado cuando se hace clic en el botón de reintentar.
 */
@customElement("listado-error")
export class ListadoError extends LitElement {

  @property({type: String}) errorIcon = "triangle-exclamation";
  @property({type: String}) errorTitle = "Error al cargar";
  @property({type: String}) errorDescription = "No se pudieron obtener los datos.";

  override createRenderRoot() {
    return this;
  }

  private handleRetry(): void {
    this.dispatchEvent(new CustomEvent('listado-retry', {
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    return html`
      <wa-card appearance="filled-outlined">
        <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
          <wa-icon name="${this.errorIcon}" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
          <div class="wa-stack wa-gap-2xs">
            <h3 class="wa-heading-m" style="margin: 0;">${this.errorTitle}</h3>
            <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">${this.errorDescription}</p>
          </div>
          <wa-button variant="brand" appearance="accent" size="medium" @click=${this.handleRetry}>
            <wa-icon slot="start" name="arrow-rotate-right"></wa-icon>
            Reintentar
          </wa-button>
        </div>
      </wa-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "listado-error": ListadoError;
  }
}
