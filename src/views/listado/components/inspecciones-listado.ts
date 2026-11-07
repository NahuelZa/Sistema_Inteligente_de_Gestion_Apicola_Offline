import {html, LitElement, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {DocumentWithId} from "../../../services";
import type {Inspeccion, Colmena, Apiario} from "../../../models";
import {inspeccionService, colmenaService, apiarioService} from "../../../services";
import {ROUTES} from "../../../constants";
import {dispatchNavigate} from "../../../utils";
import {FeedbackController, FirestoreController} from "../../../controllers";

/**
 * Componente para listar y gestionar inspecciones.
 */
@customElement("inspecciones-listado")
export class InspeccionesListado extends LitElement {

  private feedback = new FeedbackController(this);
  private task: FirestoreController<Inspeccion> | null = null;
  @state() private colmenas: DocumentWithId<Colmena>[] = [];
  @state() private apiarios: DocumentWithId<Apiario>[] = [];
  @state() private deletingId: string | null = null;
  @state() private mostrarInactivos = false;

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

  private isInactive(inspeccion: DocumentWithId<Inspeccion>): boolean {
    return inspeccion.anulada === true;
  }

  private getFilteredItems(items: DocumentWithId<Inspeccion>[]): DocumentWithId<Inspeccion>[] {
    return this.mostrarInactivos
      ? items
      : items.filter((item) => !this.isInactive(item));
  }

  private handleToggleInactive(e: CustomEvent): void {
    this.mostrarInactivos = e.detail.showInactive;
  }

  private handleCreate(): void {
    dispatchNavigate(this, ROUTES.INSPECCION);
  }

  private handleRetry(): void {
    this.task?.loadDocuments();
  }

  private async handleAnularInspeccion(inspeccion: DocumentWithId<Inspeccion>, motivo: string): Promise<void> {
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

  private renderItems(items: DocumentWithId<Inspeccion>[]) {
    const filtrados = this.getFilteredItems(items);

    return html`
      <div class="wa-stack wa-gap-m">
        ${filtrados.map((inspeccion) => {
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
        })}
      </div>
    `;
  }

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
      complete: (items: DocumentWithId<Inspeccion>[]) => {
        const filtrados = this.getFilteredItems(items);

        // Si no hay items en absoluto, mostrar estado vacío
        if (items.length === 0) {
          return html`
            <listado-empty
              .emptyIcon=${"clipboard-check"}
              .emptyTitle=${"No hay inspecciones registradas"}
              .emptyDescription=${"Registra la primera revisión sanitaria de tus colmenas en campo."}
              .newButtonText=${"Nueva inspección"}
              .newButtonTestId=${"btn-nueva-inspeccion"}
              @listado-create=${this.handleCreate}
            ></listado-empty>
          `;
        }

        // Si no hay activas y el checkbox no está marcado, mostrar toolbar + empty sin activas
        if (filtrados.length === 0 && !this.mostrarInactivos) {
          return html`
            <listado-toolbar
              .newButtonText=${"Nueva inspección"}
              .newButtonTestId=${"btn-nueva-inspeccion"}
              .showInactiveLabel=${"Mostrar anuladas"}
              .showInactiveHint=${"Incluye inspecciones anuladas"}
              @listado-create=${this.handleCreate}
              @listado-toggle-inactive=${this.handleToggleInactive}
            ></listado-toolbar>
            <listado-empty
              .emptyIcon=${"clipboard-check"}
              .noActiveText=${"No hay inspecciones activas."}
              .newButtonText=${"Nueva inspección"}
              .newButtonTestId=${"btn-nueva-inspeccion"}
              .noActive=${true}
              @listado-create=${this.handleCreate}
            ></listado-empty>
          `;
        }

        // Caso normal: toolbar + items
        return html`
          <listado-toolbar
            .newButtonText=${"Nueva inspección"}
            .newButtonTestId=${"btn-nueva-inspeccion"}
            .showInactiveLabel=${"Mostrar anuladas"}
            .showInactiveHint=${"Incluye inspecciones anuladas"}
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
    "inspecciones-listado": InspeccionesListado;
  }
}
