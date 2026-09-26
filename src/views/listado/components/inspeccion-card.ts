import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { DocumentWithId } from "../../../services";
import type { Inspeccion, Colmena, Apiario } from "../../../models";

/**
 * Componente para mostrar una tarjeta individual de Inspección de Colmena.
 */
@customElement("inspeccion-card")
export class InspeccionCard extends LitElement {
  @property({ type: Object }) inspeccion!: DocumentWithId<Inspeccion>;
  @property({ type: Array }) colmenas: DocumentWithId<Colmena>[] = [];
  @property({ type: Array }) apiarios: DocumentWithId<Apiario>[] = [];
  @property({ type: Boolean }) deleting = false;

  override createRenderRoot() {
    return this;
  }

  private handleDelete() {
    this.dispatchEvent(
      new CustomEvent("delete", {
        detail: { inspeccion: this.inspeccion },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getColmenaLabel(): string {
    const colmena = this.colmenas.find((c) => c.id === this.inspeccion.colmenaId);
    return colmena ? colmena.numeroColmena : this.inspeccion.colmenaId || "Colmena";
  }

  private getSanidadBadgeVariant(estado?: string): "success" | "warning" | "danger" | "neutral" {
    switch (estado) {
      case "bueno":
        return "success";
      case "alerta":
        return "warning";
      case "enferma":
        return "danger";
      default:
        return "neutral";
    }
  }

  override render() {
    if (!this.inspeccion) return nothing;

    const colmenaLabel = this.getColmenaLabel();
    const notas = this.inspeccion.notas || "";

    return html`
      <wa-card id="card-inspeccion-${this.inspeccion.id}">
        <div slot="header" class="wa-cluster wa-gap-xs wa-align-items-center">
          <wa-icon name="clipboard-check" style="color: var(--wa-color-brand); font-size: 1.15rem;"></wa-icon>
          <strong class="wa-heading-s">Inspección - Colmena ${colmenaLabel}</strong>
        </div>
          <div slot="header-actions" class="wa-cluster wa-gap-2xs">
              <document-sync-status .documento=${this.inspeccion}></document-sync-status>
              <wa-badge
                      variant=${this.getSanidadBadgeVariant(this.inspeccion.estadoSanitario)}
                      appearance="accent"
                      size="small"
              >
                  Sanidad: ${this.inspeccion.estadoSanitario || "N/A"}
              </wa-badge>          </div>

        <div class="wa-stack wa-gap-s">
          <div class="wa-cluster wa-gap-xs wa-align-items-center wa-caption-s wa-color-text-quiet">
            <wa-icon name="calendar" class="wa-color-text-quiet"></wa-icon>
            <span>
              <strong>Fecha:</strong>
              ${this.inspeccion.fecha
                ? new Date(this.inspeccion.fecha).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Sin fecha"}
            </span>
          </div>

          <div class="wa-cluster wa-gap-xs" style="flex-wrap: wrap;">
            <wa-badge variant="neutral" appearance="outlined" size="small">
              <wa-icon slot="start" name="users"></wa-icon>
              Población: ${this.inspeccion.poblacion || "media"}
            </wa-badge>

            <wa-badge
              variant=${this.inspeccion.reinaVista ? "success" : "neutral"}
              appearance="outlined"
              size="small"
            >
              <wa-icon slot="start" name=${this.inspeccion.reinaVista ? "circle-check" : "circle-xmark"}></wa-icon>
              ${this.inspeccion.reinaVista ? "Reina vista" : "Reina no vista"}
            </wa-badge>

            <wa-badge
              variant=${this.inspeccion.tienePostura ? "success" : "neutral"}
              appearance="outlined"
              size="small"
            >
              <wa-icon slot="start" name=${this.inspeccion.tienePostura ? "circle-check" : "circle-xmark"}></wa-icon>
              ${this.inspeccion.tienePostura ? "Tiene postura" : "Sin postura"}
            </wa-badge>
          </div>

          ${this.inspeccion.enfermedadesDetectadas
            ? html`
                <div class="wa-cluster wa-gap-xs wa-align-items-center wa-body-s wa-color-danger">
                  <wa-icon name="triangle-exclamation"></wa-icon>
                  <span><strong>Enfermedades:</strong> ${this.inspeccion.enfermedadesDetectadas}</span>
                </div>
              `
            : nothing}

          ${notas
            ? html`
                <div class="wa-cluster wa-gap-xs wa-align-items-start wa-body-s wa-color-text-normal">
                  <wa-icon name="note-sticky" class="wa-color-text-quiet" style="margin-top: 3px;"></wa-icon>
                  <span>${notas}</span>
                </div>
              `
            : nothing}
        </div>

        <wa-button
          slot="footer"
          variant="danger"
          appearance="filled"
          size="small"
          ?loading=${this.deleting}
          @click=${this.handleDelete}
        >
          <wa-icon slot="start" name="trash"></wa-icon>
          Eliminar
        </wa-button>
      </wa-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "inspeccion-card": InspeccionCard;
  }
}
