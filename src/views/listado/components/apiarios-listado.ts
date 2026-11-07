import {html, LitElement, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {DocumentWithId} from "../../../services";
import type {Apiario} from "../../../models";
import {apiarioService} from "../../../services";
import {ROUTES} from "../../../constants";
import {dispatchNavigate} from "../../../utils";
import {FeedbackController, FirestoreController} from "../../../controllers";

/**
 * Componente para listar y gestionar apiarios.
 */
@customElement("apiarios-listado")
export class ApiariosListado extends LitElement {

  private feedback = new FeedbackController(this);
  private task: FirestoreController<Apiario> | null = null;
  @state() private deletingId: string | null = null;
  @state() private mostrarInactivos = false;

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

  private isInactive(apiario: DocumentWithId<Apiario>): boolean {
    return apiario.estado === 'inactivo';
  }

  private getFilteredItems(items: DocumentWithId<Apiario>[]): DocumentWithId<Apiario>[] {
    return this.mostrarInactivos
      ? items
      : items.filter((item) => !this.isInactive(item));
  }

  private handleToggleInactive(e: CustomEvent): void {
    this.mostrarInactivos = e.detail.showInactive;
  }

  private handleCreate(): void {
    dispatchNavigate(this, ROUTES.APIARIO);
  }

  private handleRetry(): void {
    this.task?.loadDocuments();
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

  private renderItems(items: DocumentWithId<Apiario>[]) {
    const filtrados = this.getFilteredItems(items);

    return html`
      <div class="wa-stack wa-gap-m">
        ${filtrados.map((apiario) => {
          const deleting = this.deletingId === apiario.id;
          return html`
            <apiario-card
              .apiario=${apiario}
              .deleting=${deleting}
              @delete=${(e: CustomEvent) => this.handleDelete(e.detail.apiario)}
            ></apiario-card>
          `;
        })}
      </div>
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
        const filtrados = this.getFilteredItems(items);

        // Si no hay items en absoluto, mostrar estado vacío
        if (items.length === 0) {
          return html`
            <listado-empty
              .emptyIcon=${"cubes-stacked"}
              .emptyTitle=${"No hay apiarios registrados"}
              .emptyDescription=${"Crea tu primer apiario para comenzar a gestionarlo."}
              .newButtonText=${"Nuevo apiario"}
              .newButtonTestId=${"btn-nuevo-apiario"}
              @listado-create=${this.handleCreate}
            ></listado-empty>
          `;
        }

        // Si no hay activos y el checkbox no está marcado, mostrar toolbar + empty sin activos
        if (filtrados.length === 0 && !this.mostrarInactivos) {
          return html`
            <listado-toolbar
              .newButtonText=${"Nuevo apiario"}
              .newButtonTestId=${"btn-nuevo-apiario"}
              .showInactiveLabel=${"Mostrar inactivos"}
              .showInactiveHint=${"Incluye apiarios dados de baja"}
              @listado-create=${this.handleCreate}
              @listado-toggle-inactive=${this.handleToggleInactive}
            ></listado-toolbar>
            <listado-empty
              .emptyIcon=${"cubes-stacked"}
              .noActiveText=${"No hay apiarios activos."}
              .newButtonText=${"Nuevo apiario"}
              .newButtonTestId=${"btn-nuevo-apiario"}
              .noActive=${true}
              @listado-create=${this.handleCreate}
            ></listado-empty>
          `;
        }

        // Caso normal: toolbar + items
        return html`
          <listado-toolbar
            .newButtonText=${"Nuevo apiario"}
            .newButtonTestId=${"btn-nuevo-apiario"}
            .showInactiveLabel=${"Mostrar inactivos"}
            .showInactiveHint=${"Incluye apiarios dados de baja"}
            .showInactive=${this.mostrarInactivos}
            @listado-create=${this.handleCreate}
            @listado-toggle-inactive=${this.handleToggleInactive}
          ></listado-toolbar>
          ${this.renderItems(items)}
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
