import { type ReactiveController, type ReactiveControllerHost } from "lit";
import { waitForPendingWrites, enableNetwork, type Unsubscribe } from "firebase/firestore";
import { onAuthStateChanged, type Unsubscribe as AuthUnsubscribe } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { FirestoreService } from "../services";

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  hasPendingWrites: boolean;
  lastSyncTime: Date | null;
  errorMessage: string | null;
}

const LAST_SYNC_KEY = "beekeep_last_sync_time";

/**
 * Controlador reactivo para gestionar el estado de sincronización y conectividad de la aplicación.
 * Conecta el ciclo de vida del componente Lit directamente con eventos de red y Firestore.
 */
export class SyncController implements ReactiveController {
  private host: ReactiveControllerHost;
  private authUnsubscribe: AuthUnsubscribe | null = null;
  private snapshotUnsubscribes: Unsubscribe[] = [];
  private pendingCollections: string[] = [];

  public state: SyncState = {
    isOnline: navigator.onLine,
    isSyncing: false,
    hasPendingWrites: false,
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

  get lastSyncTime(): Date | null {
    return this.state.lastSyncTime;
  }

  get isFirstSyncPending(): boolean {
    return this.state.lastSyncTime === null;
  }

  get errorMessage(): string | null {
    return this.state.errorMessage;
  }

  private loadLastSyncTime(): Date | null {
    const stored = localStorage.getItem(LAST_SYNC_KEY) || localStorage.getItem("beekeep_last_sync_timestamp");
    return stored ? new Date(stored) : null;
  }

  public saveLastSyncTime(date: Date): void {
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

  private setupSnapshotListeners(userId: string): void {
    this.cleanupSnapshotListeners();
    const services = FirestoreService.getInstances();

    services.forEach((service) => {
      try {
        const unsubscribe = service.onPendingWritesChange(userId, (hasPendingChanges) => {
          if (hasPendingChanges) {
            this.pendingCollections.push(service.getCollectionName());
          } else {
            this.pendingCollections = this.pendingCollections.filter(name => name !== service.getCollectionName());
          }

          this.updateState({
            hasPendingWrites : this.pendingCollections.length > 0,
          });
        });
        this.snapshotUnsubscribes.push(unsubscribe);
      } catch (err) {
        console.error(`Error configurando listener para ${service.getCollectionName()}:`, err);
      }
    });
  }

  private cleanupSnapshotListeners(): void {
    this.snapshotUnsubscribes.forEach((unsub) => unsub());
    this.snapshotUnsubscribes = [];
    this.pendingCollections = [];
  }

  hostConnected(): void {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setupSnapshotListeners(user.uid);
      } else {
        this.cleanupSnapshotListeners();
      }
    });
  }

  hostDisconnected(): void {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    this.cleanupSnapshotListeners();
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
