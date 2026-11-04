import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { DocumentWithId } from "../../../services/FirestoreService";
import type { Colmena } from "../../../models/colmena.model";
import {EstadoModelo} from "../../../models";

/**
 * Componente para mostrar una tarjeta individual de Colmena.
 */
@customElement("colmena-card")
export class ColmenaCard extends LitElement {
  @property({ type: Object }) colmena!: DocumentWithId<Colmena>;
  @property({ type: Array }) apiarios: any[] = [];
  @property({ type: Boolean }) deleting = false;

  override createRenderRoot() {
    return this;
  }

  private handleDelete() {
    this.dispatchEvent(
      new CustomEvent("delete", {
        detail: { colmena: this.colmena },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleTrasladar() {
    this.dispatchEvent(
      new CustomEvent("trasladar", {
        detail: { colmenaId: this.colmena.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getApiarioNombre(): string {
    const apiario = this.apiarios.find((a) => a.id === this.colmena.apiarioId);
    return apiario ? apiario.nombre : 'Apiario no encontrado';
  }

  override render() {
    if (!this.colmena) return nothing;

    const isInactiva = this.colmena.estado === EstadoModelo.INACTIVO;
    const apiarioNombre = this.getApiarioNombre();

    return html`
      <wa-card id="card-colmena-${this.colmena.id}">
        <div slot="header" class="wa-cluster wa-gap-xs wa-align-items-center">
          <wa-icon name="cube" style="color: var(--wa-color-brand); font-size: 1.15rem;"></wa-icon>
          <strong class="wa-heading-s">${this.colmena.numeroColmena}</strong>
          ${isInactiva ? html`<wa-badge variant="danger" appearance="accent" size="small">Inactiva</wa-badge>` : nothing}
        </div>
          <div slot="header-actions">
              <document-sync-status .documento=${this.colmena}></document-sync-status>
              <wa-badge slot="header-actions" variant="brand" appearance="accent">${apiarioNombre}</wa-badge>
          </div>
        <div class="wa-stack wa-gap-xs">
          <div class="wa-cluster wa-gap-xs wa-align-items-center wa-body-s wa-color-text-normal">
            <wa-icon name="calendar-check" class="wa-color-text-quiet"></wa-icon>
            <span><strong>Alta:</strong> ${this.colmena.fechaAlta}</span>
          </div>
          ${this.colmena.notas
            ? html`
                <div class="wa-cluster wa-gap-xs wa-align-items-center wa-body-s wa-color-text-normal">
                  <wa-icon name="note-sticky" class="wa-color-text-quiet"></wa-icon>
                  <span>${this.colmena.notas}</span>
                </div>
              `
            : nothing}
        </div>

        <div slot="footer" class="wa-cluster" style="gap: var(--wa-space-xs);">
          <wa-button
            variant="brand"
            appearance="filled"
            size="small"
            @click=${this.handleTrasladar}
          >
            <wa-icon slot="start" name="truck"></wa-icon>
            Trasladar
          </wa-button>
          <wa-button
            variant="danger"
            appearance="filled"
            size="small"
            ?loading=${this.deleting}
            @click=${this.handleDelete}
          >
            <wa-icon slot="start" name="trash"></wa-icon>
            ${isInactiva ? 'Activar' : 'Inactivar'}
          </wa-button>
        </div>
      </wa-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "colmena-card": ColmenaCard;
  }
}
