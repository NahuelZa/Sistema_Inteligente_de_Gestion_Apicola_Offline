import { nothing, type ReactiveController, type ReactiveControllerHost } from "lit";
import {doc, type DocumentData, type WithFieldValue} from "firebase/firestore";
import type { FirestoreService, DocumentWithId } from "../services/FirestoreService";

export type TaskStatus = "initial" | "pending" | "complete" | "error";

export interface FirestoreControllerOptions<T> {
  autoLoad?: boolean;
  onSuccess?: (data: DocumentWithId<T>[]) => void;
  onError?: (error: unknown) => void;
}

export interface FirestoreRenderOptions<T> {
  initial?: () => unknown;
  pending?: () => unknown;
  complete?: (data: DocumentWithId<T>[]) => unknown;
  error?: (error: unknown) => unknown;
}

/**
 * Controlador asíncrono genérico para manejar operaciones y estado de colecciones con FirestoreService.
 * Sigue el patrón de Asynchronous Tasks de Reactive Controllers de Lit.
 */
export class FirestoreController<T extends DocumentData = DocumentData> implements ReactiveController {
  private host: ReactiveControllerHost;
  private service: FirestoreService<T>;
  private options: FirestoreControllerOptions<T>;
  private currentRunId = 0;

  public status: TaskStatus = "initial";
  public value: DocumentWithId<T>[] = [];
  public error: unknown = null;

  constructor(
    host: ReactiveControllerHost,
    service: FirestoreService<T>,
    options: FirestoreControllerOptions<T> = {}
  ) {
    this.host = host;
    this.service = service;
    this.options = { autoLoad: true, ...options };
    host.addController(this);
  }

  public get loading(): boolean {
    return this.status === "pending";
  }

  hostConnected(): void {
    if (this.options.autoLoad !== false) {
      void this.loadAndAddListeners();
    }
  }

  private async loadAndAddListeners() {
    const data = await this.loadDocuments();
    for (const doc of data) {
      window.addEventListener("online", () => this.service.onSyncDo(doc.id, () => this.loadDocuments()));
    }
  }

  hostDisconnected(): void {
    // Invalida cualquier petición asíncrona pendiente para evitar carreras al reconectar
    this.currentRunId++;
  }

  /**
   * Ejecuta la carga asíncrona de todos los documentos de la colección.
   * Maneja condiciones de carrera ignorando respuestas obsoletas.
   */
  public async loadDocuments(): Promise<DocumentWithId<T>[]> {
    const runId = ++this.currentRunId;
    this.status = "pending";
    this.error = null;
    this.host.requestUpdate();

    try {
      const data = await this.service.getAll();
      if (this.esUltimoPedido(runId)) {
        this.value = data;
        this.status = "complete";
        this.options.onSuccess?.(data);
        this.host.requestUpdate();
      }
      return data;
    } catch (err) {
      if (this.esUltimoPedido(runId)) {
        this.error = err;
        this.status = "error";
        this.options.onError?.(err);
        this.host.requestUpdate();
      }
      throw err;
    }
  }

  private esUltimoPedido(runId: number) {
    return this.currentRunId === runId;
  }

  /**
   * Elimina un documento por su ID y actualiza el estado local de la lista.
   */
  public async delete(id: string): Promise<void> {
    this.service.delete(id);
    this.value = this.value.filter((item) => item.id !== id);
    this.host.requestUpdate();
  }

  /**
   * Crea un nuevo documento en la colección.
   */
  public async create(data: WithFieldValue<Omit<T, "id">>): Promise<string> {
    const id = await this.service.create(data);
    return id;
  }

  /**
   * Renderiza condicionalmente según el estado de la tarea asíncrona.
   */
  public render(renderers: FirestoreRenderOptions<T>): unknown {
    switch (this.status) {
      case "initial":
        return renderers.initial ? renderers.initial() : (renderers.pending ? renderers.pending() : nothing);
      case "pending":
        return renderers.pending ? renderers.pending() : nothing;
      case "complete":
        return renderers.complete ? renderers.complete(this.value) : nothing;
      case "error":
        return renderers.error ? renderers.error(this.error) : nothing;
      default:
        return nothing;
    }
  }
}
