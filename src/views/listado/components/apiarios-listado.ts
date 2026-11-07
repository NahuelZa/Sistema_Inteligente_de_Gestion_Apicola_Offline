import {html, LitElement, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {DocumentWithId} from "../../../services";
import {apiarioService} from "../../../services";
import {type Apiario, EstadoModelo} from "../../../models";
import {ROUTES} from "../../../constants";
import {dispatchNavigate} from "../../../utils";
import {FeedbackController, FirestoreController, ListadoController} from "../../../controllers";
import type {ListadoLayoutConfig} from "./listado-layout";

/**
 * Componente para listar y gestionar apiarios.
 */
@customElement("apiarios-listado")
export class ApiariosListado extends LitElement {

  private feedback = new FeedbackController(this);
  private task: FirestoreController<Apiario> | null = null;
  private listado = new ListadoController<DocumentWithId<Apiario>>(this, {
    isInactive: (apiario) => apiario.estado === EstadoModelo.INACTIVO,
  });
  @state() private deletingId: string | null = null;

  private readonly layoutConfig: ListadoLayoutConfig = {
    emptyIcon: "cubes-stacked",
    emptyTitle: "No hay apiarios registrados",
    emptyDescription: "Crea tu primer apiario para comenzar a gestionarlo.",
    noActiveText: "No hay apiarios activos.",
    newButtonText: "Nuevo apiario",
    newButtonTestId: "btn-nuevo-apiario",
    showInactiveLabel: "Mostrar inactivos",
    showInactiveHint: "Incluye apiarios dados de baja",
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.task = new FirestoreController(this, apiarioService, {
      autoLoad: true,
      onError: (error) => {
        console.error("Error al cargar apiarios:", error);
        this.feedback.show("Error al cargar los apiarios.", "danger");
      },
    });
  }

  private handleCreate(): void {
    dispatchNavigate(this, ROUTES.APIARIO);
  }

  private handleRetry(): void {
    this.task?.loadDocuments();
  }

  private handleToggleInactive(e: CustomEvent): void {
    this.listado.toggleInactive(e.detail.showInactive);
  }

  private async handleDelete(apiario: DocumentWithId<Apiario>): Promise<void> {
    const confirmAction = window.confirm(
      apiario.estado === 'inactivo'
        ? `¿Estás seguro de reactivar el apiario "${apiario.nombre}"?`
        : `¿Estás seguro de dar de baja el apiario "${apiario.nombre}"? Las colmenas e inspecciones asociadas se preservarán.`
    );
    if (!confirmAction) return;

    try {
      this.deletingId = apiario.id;
      const esReactivacion = apiario.estado === 'inactivo';
      if (esReactivacion) {
        await apiarioService.reactivar(apiario.id);
      } else {
        await apiarioService.inactivar(apiario.id);
      }
      await this.task!.loadDocuments();
      this.feedback.show(
        `Apiario "${apiario.nombre}" ${esReactivacion ? 'reactivado' : 'dado de baja'} correctamente.`,
        "success"
      );
    } catch (error) {
      console.error("Error al modificar estado del apiario:", error);
      this.feedback.show("No se pudo modificar el estado del apiario. Intenta nuevamente.", "danger");
    } finally {
      this.deletingId = null;
    }
  }

  private renderItem(apiario: DocumentWithId<Apiario>) {
    const deleting = this.deletingId === apiario.id;
    return html`
      <apiario-card
        .apiario=${apiario}
        .deleting=${deleting}
        @delete=${(e: CustomEvent) => this.handleDelete(e.detail.apiario)}
      ></apiario-card>
    `;
  }

  override render() {
    if (!this.task) return nothing;

    return this.task.render({
      pending: () => html`
        <listado-pending .loadingText=${"Cargando apiarios..."}></listado-pending>
      `,
      error: () => html`
        <listado-error
          .errorTitle=${"Error al cargar apiarios"}
          .errorDescription=${"No se pudieron obtener los datos. Intenta nuevamente."}
          @listado-retry=${this.handleRetry}
        ></listado-error>
      `,
      complete: (items: DocumentWithId<Apiario>[]) => {
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
    "apiarios-listado": ApiariosListado;
  }
}
