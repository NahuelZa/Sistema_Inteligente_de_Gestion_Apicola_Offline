import {html, LitElement, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {DocumentWithId} from "../../../services";
import type {Colmena, Apiario} from "../../../models";
import {EstadoModelo} from "../../../models";
import {colmenaService, apiarioService} from "../../../services";
import {ROUTES} from "../../../constants";
import {dispatchNavigate} from "../../../utils";
import {FeedbackController, FirestoreController, ListadoController} from "../../../controllers";
import "./listado-layout";
import type {ListadoLayoutConfig} from "./listado-layout";

/**
 * Componente para listar y gestionar colmenas.
 */
@customElement("colmenas-listado")
export class ColmenasListado extends LitElement {

  private feedback = new FeedbackController(this);
  private task: FirestoreController<Colmena> | null = null;
  private listado = new ListadoController<DocumentWithId<Colmena>>(this, {
    isInactive: (colmena) => colmena.estado === EstadoModelo.INACTIVO,
  });
  @state() private apiarios: DocumentWithId<Apiario>[] = [];
  @state() private deletingId: string | null = null;

  private readonly layoutConfig: ListadoLayoutConfig = {
    emptyIcon: "cube",
    emptyTitle: "No hay colmenas registradas",
    emptyDescription: "Registra tu primera colmena para comenzar el seguimiento.",
    noActiveText: "No hay colmenas activas.",
    newButtonText: "Nueva colmena",
    newButtonTestId: "btn-nueva-colmena",
    showInactiveLabel: "Mostrar inactivas",
    showInactiveHint: "Incluye colmenas dadas de baja",
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.task = new FirestoreController(this, colmenaService, {
      autoLoad: true,
      onError: (error) => {
        console.error("Error al cargar colmenas:", error);
        this.feedback.show("Error al cargar las colmenas.", "danger");
      },
    });
    void apiarioService.getAll()
      .then((apiarios: DocumentWithId<Apiario>[]) => {
        this.apiarios = apiarios;
      })
      .catch((error) => console.error("Error al cargar apiarios:", error));
  }

  private handleCreate(): void {
    dispatchNavigate(this, ROUTES.COLMENA);
  }

  private handleRetry(): void {
    this.task?.loadDocuments();
  }

  private handleToggleInactive(e: CustomEvent): void {
    this.listado.toggleInactive(e.detail.showInactive);
  }

  private async handleDelete(colmena: DocumentWithId<Colmena>): Promise<void> {
    const confirmAction = window.confirm(
      colmena.estado === EstadoModelo.INACTIVO
        ? `¿Estás seguro de reactivar la colmena "${colmena.numeroColmena}"?`
        : `¿Estás seguro de dar de baja la colmena "${colmena.numeroColmena}"? Las inspecciones históricas se preservarán.`
    );
    if (!confirmAction) return;

    try {
      this.deletingId = colmena.id;
      const esReactivacion = colmena.estado === EstadoModelo.INACTIVO;
      if (esReactivacion) {
        await colmenaService.reactivar(colmena.id);
      } else {
        await colmenaService.inactivar(colmena.id);
      }
      await this.task!.loadDocuments();
      this.feedback.show(
        `Colmena "${colmena.numeroColmena}" ${esReactivacion ? 'reactivada' : 'dada de baja'} correctamente.`,
        "success"
      );
    } catch (error) {
      console.error("Error al modificar estado de la colmena:", error);
      this.feedback.show("No se pudo modificar el estado de la colmena. Intenta nuevamente.", "danger");
    } finally {
      this.deletingId = null;
    }
  }

  private handleTrasladarColmena(colmenaId: string): void {
    dispatchNavigate(this, `${ROUTES.TRASLADO}/${colmenaId}`);
  }

  private renderItem(colmena: DocumentWithId<Colmena>) {
    const deleting = this.deletingId === colmena.id;
    return html`
      <colmena-card
        .colmena=${colmena}
        .apiarios=${this.apiarios}
        .deleting=${deleting}
        @delete=${(e: CustomEvent) => this.handleDelete(e.detail.colmena)}
        @trasladar=${(e: CustomEvent) => this.handleTrasladarColmena(e.detail.colmenaId)}
      ></colmena-card>
    `;
  }

  override render() {
    if (!this.task) return nothing;

    return this.task.render({
      pending: () => html`
        <listado-pending .loadingText=${"Cargando colmenas..."}></listado-pending>
      `,
      error: () => html`
        <listado-error
          .errorTitle=${"Error al cargar colmenas"}
          .errorDescription=${"No se pudieron obtener los datos. Intenta nuevamente."}
          @listado-retry=${this.handleRetry}
        ></listado-error>
      `,
      complete: (items: DocumentWithId<Colmena>[]) => {
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
    "colmenas-listado": ColmenasListado;
  }
}
