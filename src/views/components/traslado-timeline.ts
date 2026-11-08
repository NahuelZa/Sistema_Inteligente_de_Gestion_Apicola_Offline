import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { trasladoService } from "../../services";
import type { Apiario } from "../../models";
import { HistorialTrasladoModel } from "../../models";
import type { DocumentWithId } from "../../services";

/**
 * Componente que muestra el historial de traslados de una colmena
 * en orden cronológico inverso.
 */
@customElement("traslado-timeline")
export class TrasladoTimeline extends LitElement {
  @property({ type: String }) colmenaId: string | null = null;
  @property({ type: Array }) apiarios: DocumentWithId<Apiario>[] = [];
  @property({ type: Boolean }) loading = false;

  private traslados: HistorialTrasladoModel[] = [];

  override createRenderRoot() {
    return this;
  }

  override async connectedCallback() {
    super.connectedCallback();
    if (this.colmenaId) {
      await this.loadTraslados();
    }
  }

  private async loadTraslados(): Promise<void> {
    if (!this.colmenaId) return;
    this.loading = true;
    try {
      this.traslados = await trasladoService.getTrasladosPorColmena(this.colmenaId);
    } catch (error) {
      console.error("Error al cargar historial de traslados:", error);
    } finally {
      this.loading = false;
    }
  }

  private getApiarioNombre(apiarioId: string): string {
    const apiario = this.apiarios?.find((a) => a.id === apiarioId);
    return apiario ? apiario.nombre : "Apiario desconocido";
  }

  override render() {
    if (this.loading) {
      return html`
        <div class="wa-stack wa-align-items-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
          <wa-spinner style="font-size: 2rem; --indicator-color: var(--wa-color-brand);"></wa-spinner>
          <span class="wa-body-s wa-color-text-quiet">Cargando historial de traslados...</span>
        </div>
      `;
    }

    if (this.traslados.length === 0) {
      return html`
        <div class="wa-text-center" style="padding: var(--wa-space-xl) var(--wa-space-l);">
          <wa-icon name="truck" class="wa-color-text-quiet" style="font-size: 2rem;"></wa-icon>
          <p class="wa-body-s wa-color-text-quiet">No hay traslados registrados para esta colmena.</p>
        </div>
      `;
    }

    return html`
      <div class="wa-stack wa-gap-s">
        ${this.traslados.map((t) => html`
          <wa-card appearance="filled-outlined">
            <div class="wa-stack" style="gap: var(--wa-space-xs);">
              <div class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="calendar" class="wa-color-text-quiet"></wa-icon>
                <span class="wa-body-s"><strong>${t.fecha}</strong></span>
              </div>
              <div class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="arrow-right" class="wa-color-text-quiet"></wa-icon>
                <span class="wa-body-s">
                  ${this.getApiarioNombre(t.apiarioOrigenId)} → ${this.getApiarioNombre(t.apiarioDestinoId)}
                </span>
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
    "traslado-timeline": TrasladoTimeline;
  }
}
