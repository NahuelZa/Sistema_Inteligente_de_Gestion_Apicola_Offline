import {html, LitElement, nothing} from "lit";
import {customElement, property} from "lit/decorators.js";
import type {HistorialTraslado} from "../../models";

/**
 * Componente que muestra el historial de traslados de una colmena.
 */
@customElement("historial-traslados")
export class HistorialTraslados extends LitElement {
  @property({ type: Array }) traslados: HistorialTraslado[] = [];
  @property({ type: Function }) getApiarioNombre?: (apiarioId: string) => string;

  override createRenderRoot() {
    return this;
  }

  private getApiario(apiarioId: string): string {
    if (this.getApiarioNombre) {
      return this.getApiarioNombre(apiarioId);
    }
    return "Apiario desconocido";
  }

  override render() {
    if (this.traslados.length === 0) {
      return nothing;
    }

    return html`
      <div class="wa-stack" style="gap: var(--wa-space-s);">
        <h3 class="wa-heading-m">Historial de traslados</h3>
        ${this.traslados.map((t) => html`
          <wa-card>
            <div class="wa-stack" style="gap: var(--wa-space-xs);">
              <div class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="calendar" class="wa-color-text-quiet"></wa-icon>
                <span class="wa-body-s"><strong>${t.fecha}</strong></span>
              </div>
              <div class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="arrow-right" class="wa-color-text-quiet"></wa-icon>
                <span class="wa-body-s">${this.getApiario(t.apiarioOrigenId)} → ${this.getApiario(t.apiarioDestinoId)}</span>
              </div>
              <div class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="tag" class="wa-color-text-quiet"></wa-icon>
                <span class="wa-body-s">${t.motivo}</span>
              </div>
              ${t.notas ? html`
                <div class="wa-cluster wa-gap-xs wa-align-items-center">
                  <wa-icon name="note-sticky" class="wa-color-text-quiet"></wa-icon>
                  <span class="wa-body-s">${t.notas}</span>
                </div>
              ` : nothing}
            </div>
          </wa-card>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "historial-traslados": HistorialTraslados;
  }
}
