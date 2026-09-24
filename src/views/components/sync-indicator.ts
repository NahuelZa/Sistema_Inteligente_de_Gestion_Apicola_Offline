import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SyncController } from "../../controllers";

/**
 * Componente de estado de sincronización y conectividad para BeeKeep.
 * Muestra el estado de conexión (Online / Modo Campo), cantidad de operaciones pendientes (`hasPendingWrites`),
 * la última fecha de sincronización y permite forzar la sincronización manual.
 */
@customElement("sync-indicator")
export class SyncIndicator extends LitElement {
  private syncCtrl = new SyncController(this);
  @state() private feedbackMessage: string | null = null;
  @state() private feedbackType: "success" | "warning" | "danger" = "success";

  override createRenderRoot() {
    return this;
  }

  private async handleManualSync() {
    const res = await this.syncCtrl.sync();
    this.feedbackMessage = res.message;
    this.feedbackType = res.success ? "success" : "warning";

    setTimeout(() => {
      this.feedbackMessage = null;
    }, 4000);
  }

  private formatLastSync(date: Date | null): string {
    if (!date) return "Pendiente";
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  private renderStatusBadge() {
    let variant = "success";
    let text = "En línea";
    let icon = html`<wa-icon slot="start" name="cloud"></wa-icon>`;

    if (!this.syncCtrl.isOnline) {
      variant = "warning";
      text = "Modo Campo (Offline)";
      icon = html`<wa-icon slot="start" name="wifi-slash"></wa-icon>`;
    } else if (this.syncCtrl.isSyncing) {
      variant = "brand";
      text = "Sincronizando...";
      icon = html`<wa-spinner slot="start" style="font-size: 0.75rem; --indicator-color: white;"></wa-spinner>`;
    }

    return html`
      <wa-badge id="sync-status" variant=${variant} appearance="accent" style="font-size: var(--wa-font-size-xs);">
        ${icon}
        ${text}
      </wa-badge>
    `;
  }

  private renderPendingBadge() {
    const hasPending = this.syncCtrl.hasPendingWrites || this.syncCtrl.pendingCount > 0;
    const id = hasPending ? "sync-pending-badge" : "sync-synced-badge";
    const variant = hasPending ? "warning" : "neutral";
    const appearance = hasPending ? "filled" : "outlined";
    const iconName = hasPending ? "clock" : "circle-check";
    const text = hasPending
      ? "Cambios pendientes"
      : "Al día";

    return html`
      <wa-badge
        id=${id}
        variant=${variant}
        appearance=${appearance}
        size="small"
        title="Último sync: ${this.formatLastSync(this.syncCtrl.lastSyncTime)}"
      >
        <wa-icon slot="start" name=${iconName}></wa-icon>
        ${text}
      </wa-badge>
    `;
  }

  override render() {
    return html`
      <div id="sync-indicator-widget" class="wa-stack" style="gap: var(--wa-space-3xs, 4px); align-items: flex-start; width: fit-content;">
        <div class="wa-cluster wa-align-items-center wa-gap-xs" style="flex-wrap: wrap;">
          ${this.renderStatusBadge()}
          ${this.renderPendingBadge()}

          <!-- Botón de Sincronización Manual -->
          <wa-button
            id="btn-sync-manual"
            size="xs"
            variant="neutral"
            appearance="outlined"
            ?loading=${this.syncCtrl.isSyncing}
            @click=${this.handleManualSync}
            title="Forzar sincronización con la nube"
          >
            <wa-icon slot="start" name="arrow-rotate-right"></wa-icon>
            Sincronizar
          </wa-button>
        </div>

        ${this.feedbackMessage
          ? html`
              <div
                class="sync-toast-feedback wa-caption-s wa-color-${this.feedbackType}"
                style="width: 100%; text-align: left; font-weight: 500;"
              >
                ${this.feedbackMessage}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sync-indicator": SyncIndicator;
  }
}
