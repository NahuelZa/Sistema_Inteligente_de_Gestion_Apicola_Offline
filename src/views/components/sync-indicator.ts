import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SyncController } from "../../controllers";

/**
 * Componente de estado de sincronización y conectividad para BeeKeep.
 * Muestra el estado de conexión (Online / Sin conexión), si está actualizado o tiene cambios pendientes,
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

  private isPreCampoWarningNeeded(): boolean {
    if (!this.syncCtrl.isOnline) return false;
    if (this.syncCtrl.isFirstSyncPending || !this.syncCtrl.lastSyncTime) return true;

    // Advertencia si la última sincronización tiene más de 12 horas
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    const msSinceLastSync = Date.now() - this.syncCtrl.lastSyncTime.getTime();
    return msSinceLastSync > twelveHoursInMs;
  }

  private renderStatusBadge() {
    if (!this.syncCtrl.isOnline) {
      return html`
        <wa-badge id="sync-status" variant="danger" appearance="accent" style="font-size: var(--wa-font-size-xs);">
          <wa-icon slot="start" name="wifi-slash"></wa-icon>
          Sin conexión - Operando en modo local
        </wa-badge>
      `;
    }

    if (this.syncCtrl.isSyncing) {
      return html`
        <wa-badge id="sync-status" variant="brand" appearance="accent" style="font-size: var(--wa-font-size-xs);">
          <wa-spinner slot="start" style="font-size: 0.75rem; --indicator-color: white;"></wa-spinner>
          Sincronizando...
        </wa-badge>
      `;
    }

    if (this.syncCtrl.hasPendingWrites) {
      return html`
        <wa-badge id="sync-status" variant="warning" appearance="accent" style="font-size: var(--wa-font-size-xs);">
          <wa-icon slot="start" name="clock"></wa-icon>
          Cambios pendientes
        </wa-badge>
      `;
    }

    if (this.syncCtrl.isFirstSyncPending || !this.syncCtrl.lastSyncTime) {
      return html`
        <wa-badge id="sync-status" variant="neutral" appearance="accent" style="font-size: var(--wa-font-size-xs);">
          <wa-icon slot="start" name="cloud-slash"></wa-icon>
          Nunca sincronizado
        </wa-badge>
      `;
    }

    return html`
      <wa-badge id="sync-status" variant="success" appearance="accent" style="font-size: var(--wa-font-size-xs);">
        <wa-icon slot="start" name="circle-check"></wa-icon>
        Actualizado
      </wa-badge>
    `;
  }

  private renderPendingBadge() {
    if (this.syncCtrl.isFirstSyncPending || !this.syncCtrl.lastSyncTime) {
      return html`
        <wa-badge
          id="sync-never-badge"
          variant="warning"
          appearance="outlined"
          size="small"
          title="Sin sincronizaciones previas en este dispositivo"
        >
          <wa-icon slot="start" name="triangle-exclamation"></wa-icon>
          Nunca sincronizado
        </wa-badge>
      `;
    }

    const hasPending = this.syncCtrl.hasPendingWrites;
    const id = hasPending ? "sync-pending-badge" : "sync-synced-badge";
    const variant = hasPending ? "warning" : "neutral";
    const appearance = hasPending ? "filled" : "outlined";
    const iconName = hasPending ? "clock" : "circle-check";

    return html`
      <wa-badge
        id=${id}
        variant=${variant}
        appearance=${appearance}
        size="small"
      >
        <wa-icon slot="start" name=${iconName}></wa-icon>
        <wa-relative-time
          date=${this.syncCtrl.lastSyncTime.toISOString()}
          sync
        ></wa-relative-time>
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

        ${this.isPreCampoWarningNeeded()
          ? html`
              <div
                id="sync-precampo-warning"
                class="wa-cluster wa-align-items-center wa-gap-2xs"
                style="font-size: var(--wa-font-size-2xs, 0.75rem); color: var(--wa-color-warning-80, #854d0e); background: var(--wa-color-warning-10, #fef9c3); border: 1px solid var(--wa-color-warning-30, #fde047); padding: 2px 6px; border-radius: var(--wa-border-radius-s, 4px);"
              >
                <wa-icon name="triangle-exclamation" style="color: #ca8a04;"></wa-icon>
                <span>Sincronice antes de salir al campo.</span>
              </div>
            `
          : nothing}

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
