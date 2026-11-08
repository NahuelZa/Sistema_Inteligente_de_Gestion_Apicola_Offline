import {html, LitElement, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {ModeloBase} from "../../../models";
import type {Inspeccion} from "../../../models";
import {inspeccionService, colmenaService, apiarioService} from "../../../services";
import {ROUTES} from "../../../constants";
import {dispatchNavigate} from "../../../utils";
import {FeedbackController, FirestoreController, ListadoController} from "../../../controllers";
import "./listado-layout";
import type {ListadoLayoutConfig} from "./listado-layout";

/**
 * Componente para listar y gestionar inspecciones.
 */
@customElement("inspecciones-listado")
export class InspeccionesListado extends LitElement {

  private feedback = new FeedbackController(this);
  private task: FirestoreController<Inspeccion> | null = null;
  private listado = new ListadoController(this);
  @state() private colmenas: ModeloBase[] = [];
  @state() private apiarios: ModeloBase[] = [];
  @state() private deletingId: string | null = null;

  private readonly layoutConfig: ListadoLayoutConfig = {
    emptyIcon: "clipboard-check",
    emptyTitle: "No hay inspecciones registradas",
    emptyDescription: "Registra la primera revisión sanitaria de tus colmenas en campo.",
    noActiveText: "No hay inspecciones activas.",
    newButtonText: "Nueva inspección",
    newButtonTestId: "btn-nueva-inspeccion",
    showInactiveLabel: "Mostrar anuladas",
    showInactiveHint: "Incluye inspecciones anuladas",
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.task = new FirestoreController(this, inspeccionService, {
      autoLoad: true,
      onError: (error) => {
        console.error("Error al cargar inspecciones:", error);
        this.feedback.show("Error al cargar las inspecciones.", "danger");
      },
    });
    void Promise.all([colmenaService.getAll(), apiarioService.getAll()])
      .then(([colmenas, apiarios]) => {
        this.colmenas = colmenas;
        this.apiarios = apiarios;
      })
      .catch((error) => console.error("Error al cargar datos:", error));
  }

  private handleCreate(): void {
    dispatchNavigate(this, ROUTES.INSPECCION);
  }

  private handleRetry(): void {
    this.task?.loadDocuments();
  }

  private handleToggleInactive(e: CustomEvent): void {
    this.listado.toggleInactive(e.detail.showInactive);
  }

  private async handleAnularInspeccion(inspeccion: ModeloBase, motivo: string): Promise<void> {
    try {
      this.deletingId = inspeccion.id;
      await inspeccionService.anularInspeccion(inspeccion.id, motivo);
      await this.task!.loadDocuments();
      this.feedback.show("Inspección anulada correctamente. El registro histórico se preservó.", "success");
    } catch (error) {
      console.error("Error al anular inspección:", error);
      this.feedback.show("No se pudo anular la inspección. Intenta nuevamente.", "danger");
    } finally {
      this.deletingId = null;
    }
  }

  private renderItem = (inspeccion: ModeloBase) => {
    const deleting = this.deletingId === inspeccion.id;
    return html`
      <inspeccion-card
        .inspeccion=${inspeccion}
        .colmenas=${this.colmenas}
        .apiarios=${this.apiarios}
        .deleting=${deleting}
        @anular=${(e: CustomEvent) => this.handleAnularInspeccion(e.detail.inspeccion, e.detail.motivo)}
      ></inspeccion-card>
    `;
  };

  override render() {
    if (!this.task) return nothing;

    return this.task.render({
      pending: () => html`
        <listado-pending .loadingText=${"Cargando historial de inspecciones..."}></listado-pending>
      `,
      error: () => html`
        <listado-error
          .errorTitle=${"Error al cargar inspecciones"}
          .errorDescription=${"No se pudieron obtener los datos. Intenta nuevamente."}
          @listado-retry=${this.handleRetry}
        ></listado-error>
      `,
      complete: (items: ModeloBase[]) => {
        const filtrados = this.listado.getFilteredItems(items);

        return html`
          <listado-layout
            .config=${this.layoutConfig}
            .totalItems=${items.length}
            .filteredItems=${filtrados}
            .showInactive=${this.listado.mostrarInactivos}
            .renderItem=${this.renderItem}
            @listado-create=${this.handleCreate}
            @listado-toggle-inactive=${this.handleToggleInactive}
          ></listado-layout>
        `;
      },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "inspecciones-listado": InspeccionesListado;
  }
}
