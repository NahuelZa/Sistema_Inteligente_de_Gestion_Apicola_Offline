import { type ReactiveController, type ReactiveControllerHost } from "lit";
import { waitForPendingWrites, enableNetwork } from "firebase/firestore";
import { db } from "../config/firebase";

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  hasPendingWrites: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  errorMessage: string | null;
}

const LAST_SYNC_KEY = "beekeep_last_sync_timestamp";

/**
 * Controlador reactivo para gestionar el estado de sincronización y conectividad de la aplicación.
 * Conecta el ciclo de vida del componente Lit directamente con eventos de red y Firestore.
 */
export class SyncController implements ReactiveController {
  private host: ReactiveControllerHost;

  public state: SyncState = {
    isOnline: navigator.onLine,
    isSyncing: false,
    hasPendingWrites: false,
    pendingCount: 0,
    lastSyncTime: this.loadLastSyncTime(),
    errorMessage: null,
  };

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  get isOnline(): boolean {
    return this.state.isOnline;
  }

  get isSyncing(): boolean {
    return this.state.isSyncing;
  }

  get hasPendingWrites(): boolean {
    return this.state.hasPendingWrites;
  }

  get pendingCount(): number {
    return this.state.pendingCount;
  }

  get lastSyncTime(): Date | null {
    return this.state.lastSyncTime;
  }

  get errorMessage(): string | null {
    return this.state.errorMessage;
  }

  private loadLastSyncTime(): Date {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? new Date(stored) : new Date();
  }

  private saveLastSyncTime(date: Date): void {
    localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.host.requestUpdate();
  }

  private handleOnline = (): void => {
    this.updateState({ isOnline: true, errorMessage: null });
    void this.sync();
  };

  private handleOffline = (): void => {
    this.updateState({ isOnline: false });
  };

  hostConnected(): void {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  hostDisconnected(): void {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  /**
   * Ejecuta una sincronización manual con Firestore esperando que se procesen las escrituras pendientes.
   */
  public async sync(): Promise<{ success: boolean; message: string }> {
    if (!navigator.onLine) {
      this.updateState({ isOnline: false });
      return {
        success: false,
        message: "No hay conexión a Internet. Las modificaciones permanecen seguras en el dispositivo.",
      };
    }

    try {
      this.updateState({ isSyncing: true, errorMessage: null });

      await enableNetwork(db).catch(() => {});
      await waitForPendingWrites(db);

      const now = new Date();
      this.saveLastSyncTime(now);
      this.updateState({
        lastSyncTime: now,
        hasPendingWrites: false,
        pendingCount: 0,
        isOnline: true,
      });

      return { success: true, message: "¡Sincronización completada con éxito!" };
    } catch (error: any) {
      console.error("Error en sincronización:", error);
      this.updateState({
        errorMessage: "Error al sincronizar con el servidor.",
      });
      return {
        success: false,
        message: "Error al sincronizar. Los datos se conservan en la memoria local.",
      };
    } finally {
      this.updateState({ isSyncing: false });
    }
  }
}
