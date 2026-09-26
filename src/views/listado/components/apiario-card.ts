import {LitElement, html, nothing} from "lit";
import {customElement, property} from "lit/decorators.js";
import type {DocumentWithId} from "../../../services/FirestoreService";
import type {Apiario} from "../../../models/apiario.model";

/**
 * Componente para mostrar una tarjeta individual de Apiario.
 */
@customElement("apiario-card")
export class ApiarioCard extends LitElement {
    @property({type: Object}) apiario!: DocumentWithId<Apiario>;
    @property({type: Boolean}) deleting = false;

    override createRenderRoot() {
        return this;
    }

    private handleDelete() {
        this.dispatchEvent(
            new CustomEvent("delete", {
                detail: {apiario: this.apiario},
                bubbles: true,
                composed: true,
            })
        );
    }

    override render() {
        if (!this.apiario) return nothing;

        return html`
        <wa-card id="card-apiario-${this.apiario.id}">
            <div slot="header" class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="cubes-stacked" style="color: var(--wa-color-brand); font-size: 1.15rem;"></wa-icon>
                <strong class="wa-heading-s">${this.apiario.nombre}</strong>
            </div>
            <div slot="header-actions">
                <document-sync-status .documento=${this.apiario}></document-sync-status>
                <wa-badge  variant="brand" appearance="accent">Apiario</wa-badge>
            </div>

            <div class="wa-stack wa-gap-xs">
                <div class="wa-cluster wa-gap-xs wa-align-items-center wa-body-s wa-color-text-normal">
                    <wa-icon name="location-dot" class="wa-color-text-quiet"></wa-icon>
                    <span><strong>Ubicación:</strong> ${this.apiario.ubicacion}</span>
                </div>
                <div class="wa-cluster wa-gap-xs wa-align-items-center wa-body-s wa-color-text-normal">
                    <wa-icon name="note-sticky" class="wa-color-text-quiet"></wa-icon>
                    <span>${this.apiario.notas}</span>
                </div>
                <div class="wa-cluster wa-gap-xs wa-align-items-center wa-caption-s wa-color-text-quiet">
                    <wa-icon name="calendar" class="wa-color-text-quiet"></wa-icon>
                    <span>
              ${new Date(this.apiario.createdAtLocal!).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })}
            </span>
                </div>
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
    "apiario-card": ApiarioCard;
  }
}
