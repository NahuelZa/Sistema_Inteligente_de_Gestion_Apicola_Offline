import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { DocumentWithId } from "../../../services/FirestoreService";
import type { Colmena } from "../../../models/colmena.model";

/**
 * Componente para mostrar una tarjeta individual de Colmena.
 */
@customElement("colmena-card")
export class ColmenaCard extends LitElement {
  @property({ type: Object }) colmena!: DocumentWithId<Colmena>;
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

  override render() {
    if (!this.colmena) return nothing;

    return html`
      <wa-card id="card-colmena-${this.colmena.id}">
        <div slot="header" class="wa-cluster wa-gap-xs wa-align-items-center">
          <wa-icon name="cube" style="color: var(--wa-color-brand); font-size: 1.15rem;"></wa-icon>
          <strong class="wa-heading-s">${this.colmena.numeroColmena}</strong>
        </div>
        <wa-badge slot="header-actions" variant="neutral" appearance="accent" size="small">${this.colmena.apiarioNombre}</wa-badge>

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
    "colmena-card": ColmenaCard;
  }
}
