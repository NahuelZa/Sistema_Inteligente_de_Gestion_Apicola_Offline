import {html, LitElement, nothing} from "lit";
import {customElement, state} from "lit/decorators.js";
import type {ModeloBase} from "../../../models";
import type {Colmena} from "../../../models";
import {ColmenaModel} from "../../../models";
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
  private listado = new ListadoController(this);
  @state() private apiarios: ModeloBase[] = [];
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
      .then((apiarios: ModeloBase[]) => {
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

  private async handleDelete(colmena: ModeloBase): Promise<void> {
    const c = colmena as ColmenaModel;
    const confirmAction = window.confirm(
      !c.esActivo()
        ? `¿Estás seguro de reactivar la colmena "${c.numeroColmena}"?`
        : `¿Estás seguro de dar de baja la colmena "${c.numeroColmena}"? Las inspecciones históricas se preservarán.`
    );
    if (!confirmAction) return;

    try {
      this.deletingId = c.id;
      const esReactivacion = !c.esActivo();
      if (esReactivacion) {
        await colmenaService.reactivar(c.id);
      } else {
        await colmenaService.inactivar(c.id);
      }
      await this.task!.loadDocuments();
      this.feedback.show(
        `Colmena "${c.numeroColmena}" ${esReactivacion ? 'reactivada' : 'dada de baja'} correctamente.`,
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

  private renderItem = (colmena: ModeloBase) => {
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
  };

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
    "colmenas-listado": ColmenasListado;
  }
}
