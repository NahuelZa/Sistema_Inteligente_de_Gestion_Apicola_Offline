import {LitElement, html, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {DocumentWithId} from "../../services";

/**
 * Componente de estado de sincronización y conectividad para un documento específico.
 */
@customElement("document-sync-status")
export class DocumentSyncStatus extends LitElement {
    @state() private documento: DocumentWithId<any>;

    override render() {
        return html`
            ${!this.documento.estaSincronizado
                    ? html`
                        <wa-badge variant="neutral" appearance="accent">
                            Pendiente
                        </wa-badge>`
                    : nothing
            }
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "document-sync-status": DocumentSyncStatus;
    }
}
