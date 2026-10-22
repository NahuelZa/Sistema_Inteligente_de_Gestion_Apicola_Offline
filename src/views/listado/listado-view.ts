import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { FeedbackController, FirestoreController } from "../../controllers";
import { apiarioService, colmenaService, inspeccionService } from "../../services";
import type { DocumentWithId } from "../../services";
import type { Apiario, Colmena, Inspeccion } from "../../models";
import { ROUTES } from "../../constants";
import { dispatchNavigate } from "../../utils";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "./components/apiario-card";
import "./components/colmena-card";
import "./components/inspeccion-card";

/**
 * Vista para mostrar y administrar apiarios, colmenas e inspecciones sanitarias.
 */
@customElement("listado-view")
export class ListadoView extends LitElement {
  @property({ type: String }) type: "apiarios" | "colmenas" | "inspecciones" = "apiarios";

  @state() private deletingId: string | null = null;
  @state() private mostrarInactivos = false;

  private feedback = new FeedbackController(this);

  private apiariosTask = new FirestoreController(this, apiarioService, {
    onError: (error) => {
      console.error("Error al cargar apiarios:", error);
      this.feedback.show("Error al cargar los apiarios.", "danger");
    },
  });

  private colmenasTask = new FirestoreController(this, colmenaService, {
    onError: (error) => {
      console.error("Error al cargar colmenas:", error);
      this.feedback.show("Error al cargar las colmenas.", "danger");
    },
  });

  private inspeccionesTask = new FirestoreController(this, inspeccionService, {
    onError: (error) => {
      console.error("Error al cargar inspecciones:", error);
      this.feedback.show("Error al cargar las inspecciones.", "danger");
    },
  });

  override createRenderRoot() {
    return this;
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has("type")) {
      if (this.type === "inspecciones") {
        void this.inspeccionesTask.loadDocuments();
        void this.colmenasTask.loadDocuments();
        void this.apiariosTask.loadDocuments();
      } else if (this.type === "colmenas") {
        void this.colmenasTask.loadDocuments();
        void this.apiariosTask.loadDocuments();
      } else {
        void this.apiariosTask.loadDocuments();
      }
    }
  }

  // TO-DO: remover código duplicado entre handleInactivar**** y  render***Tab
  private async handleInactivarApiario(apiario: DocumentWithId<Apiario>): Promise<void> {
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
      await this.apiariosTask.loadDocuments();
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

  private async handleInactivarColmena(colmena: DocumentWithId<Colmena>): Promise<void> {
    const confirmAction = window.confirm(
      colmena.estado === 'inactiva'
        ? `¿Estás seguro de reactivar la colmena "${colmena.numeroColmena}"?`
        : `¿Estás seguro de dar de baja la colmena "${colmena.numeroColmena}"? Las inspecciones históricas se preservarán.`
    );
    if (!confirmAction) return;

    try {
      this.deletingId = colmena.id;
      const esReactivacion = colmena.estado === 'inactiva';
      if (esReactivacion) {
        await colmenaService.reactivar(colmena.id);
      } else {
        await colmenaService.inactivar(colmena.id);
      }
      await this.colmenasTask.loadDocuments();
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

  private async handleAnularInspeccion(inspeccion: DocumentWithId<Inspeccion>, motivo: string): Promise<void> {
    try {
      this.deletingId = inspeccion.id;
      await inspeccionService.anularInspeccion(inspeccion.id, motivo);
      await this.inspeccionesTask.loadDocuments();
      this.feedback.show("Inspección anulada correctamente. El registro histórico se preservó.", "success");
    } catch (error) {
      console.error("Error al anular inspección:", error);
      this.feedback.show("No se pudo anular la inspección. Intenta nuevamente.", "danger");
    } finally {
      this.deletingId = null;
    }
  }

  private renderApiariosTab() {
    return this.apiariosTask.render({
      pending: () => html`
        <div class="wa-stack wa-align-items-center wa-gap-m" style="padding: var(--wa-space-2xl) var(--wa-space-l);">
          <wa-spinner style="font-size: 2.5rem; --indicator-color: var(--wa-color-brand);"></wa-spinner>
          <span class="wa-body-s wa-color-text-quiet">Cargando apiarios...</span>
        </div>
      `,
      error: () => html`
        <wa-card appearance="filled-outlined">
          <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
            <wa-icon name="triangle-exclamation" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
            <div class="wa-stack wa-gap-2xs">
              <h3 class="wa-heading-m" style="margin: 0;">Error al cargar apiarios</h3>
              <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">No se pudieron obtener los datos. Intenta nuevamente.</p>
            </div>
            <wa-button variant="brand" appearance="accent" size="medium" @click=${() => this.apiariosTask.loadDocuments()}>
              <wa-icon slot="start" name="arrow-rotate-right"></wa-icon>
              Reintentar
            </wa-button>
          </div>
        </wa-card>
      `,
      complete: (apiarios) => {
        const filtrados = this.mostrarInactivos ? apiarios : apiarios.filter((a) => a.estado !== 'inactivo');
        if (apiarios.length === 0) {
          return html`
            <wa-card appearance="filled-outlined">
              <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
                <wa-icon name="cubes-stacked" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
                <div class="wa-stack wa-gap-2xs">
                  <h3 class="wa-heading-m" style="margin: 0;">No hay apiarios registrados</h3>
                  <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">Crea tu primer apiario para comenzar a gestionarlo.</p>
                </div>
                <wa-button id="btn-nuevo-apiario-empty" variant="brand" appearance="accent" size="medium" @click=${() => this.navigateTo(ROUTES.APIARIO)}>
                  <wa-icon slot="start" name="circle-plus"></wa-icon>
                  Nuevo apiario
                </wa-button>
              </div>
            </wa-card>
          `;
        }

        return html`
          <div class="wa-split wa-align-items-center">
            <wa-checkbox
              hint="Incluye apiarios dados de baja"
              ?checked=${this.mostrarInactivos}
              @change=${(e: Event) => (this.mostrarInactivos = (e.target as HTMLInputElement).checked)}
            >
              <wa-icon slot="start" name="eye"></wa-icon>
              Mostrar inactivos
            </wa-checkbox>
            <wa-button
              id="btn-nuevo-apiario"
              variant="brand"
              appearance="accent"
              size="medium"
              @click=${() => this.navigateTo(ROUTES.APIARIO)}
            >
              <wa-icon slot="start" name="circle-plus"></wa-icon>
              Nuevo apiario
            </wa-button>
          </div>

          <div class="wa-stack wa-gap-m">
            ${filtrados.length === 0 && !this.mostrarInactivos
              ? html`<p class="wa-body-s wa-color-text-quiet" style="text-align: center;">No hay apiarios activos.</p>`
              : filtrados.map(
                  (apiario) => html`
                    <apiario-card
                      .apiario=${apiario}
                      .deleting=${this.deletingId === apiario.id}
                      @delete=${() => this.handleInactivarApiario(apiario)}
                    ></apiario-card>
                  `
                )}
          </div>
        `;
      },
    });
  }

  private renderColmenasTab() {
    return this.colmenasTask.render({
      pending: () => html`
        <div class="wa-stack wa-align-items-center wa-gap-m" style="padding: var(--wa-space-2xl) var(--wa-space-l);">
          <wa-spinner style="font-size: 2.5rem; --indicator-color: var(--wa-color-brand);"></wa-spinner>
          <span class="wa-body-s wa-color-text-quiet">Cargando colmenas...</span>
        </div>
      `,
      error: () => html`
        <wa-card appearance="filled-outlined">
          <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
            <wa-icon name="triangle-exclamation" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
            <div class="wa-stack wa-gap-2xs">
              <h3 class="wa-heading-m" style="margin: 0;">Error al cargar colmenas</h3>
              <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">No se pudieron obtener los datos. Intenta nuevamente.</p>
            </div>
            <wa-button variant="brand" appearance="accent" size="medium" @click=${() => this.colmenasTask.loadDocuments()}>
              <wa-icon slot="start" name="arrow-rotate-right"></wa-icon>
              Reintentar
            </wa-button>
          </div>
        </wa-card>
      `,
      complete: (colmenas) => {
        const filtrados = this.mostrarInactivos ? colmenas : colmenas.filter((c) => c.estado !== 'inactiva');
        if (colmenas.length === 0) {
          return html`
            <wa-card appearance="filled-outlined">
              <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
                <wa-icon name="cube" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
                <div class="wa-stack wa-gap-2xs">
                  <h3 class="wa-heading-m" style="margin: 0;">No hay colmenas registradas</h3>
                  <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">Registra tu primera colmena para comenzar el seguimiento.</p>
                </div>
                <wa-button id="btn-nueva-colmena-empty" variant="brand" appearance="accent" size="medium" @click=${() => this.navigateTo(ROUTES.COLMENA)}>
                  <wa-icon slot="start" name="circle-plus"></wa-icon>
                  Nueva colmena
                </wa-button>
              </div>
            </wa-card>
          `;
        }

        return html`
          <div class="wa-split wa-align-items-center">
            <wa-checkbox
              hint="Incluye colmenas dadas de baja"
              ?checked=${this.mostrarInactivos}
              @change=${(e: Event) => (this.mostrarInactivos = (e.target as HTMLInputElement).checked)}
            >
              <wa-icon slot="start" name="eye"></wa-icon>
              Mostrar inactivas
            </wa-checkbox>
            <wa-button
              id="btn-nueva-colmena"
              variant="brand"
              appearance="accent"
              size="medium"
              @click=${() => this.navigateTo(ROUTES.COLMENA)}
            >
              <wa-icon slot="start" name="circle-plus"></wa-icon>
              Nueva colmena
            </wa-button>
          </div>

          <div class="wa-stack wa-gap-m">
            ${filtrados.length === 0 && !this.mostrarInactivos
              ? html`<p class="wa-body-s wa-color-text-quiet" style="text-align: center;">No hay colmenas activas.</p>`
              : filtrados.map(
                  (colmena) => html`
                    <colmena-card
                      .colmena=${colmena}
                      .apiarios=${this.apiariosTask.value}
                      .deleting=${this.deletingId === colmena.id}
                      @delete=${() => this.handleInactivarColmena(colmena)}
                    ></colmena-card>
                  `
                )}
          </div>
        `;
      },
    });
  }

  private renderInspeccionesTab() {
    return this.inspeccionesTask.render({
      pending: () => html`
        <div class="wa-stack wa-align-items-center wa-gap-m" style="padding: var(--wa-space-2xl) var(--wa-space-l);">
          <wa-spinner style="font-size: 2.5rem; --indicator-color: var(--wa-color-brand);"></wa-spinner>
          <span class="wa-body-s wa-color-text-quiet">Cargando historial de inspecciones...</span>
        </div>
      `,
      error: () => html`
        <wa-card appearance="filled-outlined">
          <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
            <wa-icon name="triangle-exclamation" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
            <div class="wa-stack wa-gap-2xs">
              <h3 class="wa-heading-m" style="margin: 0;">Error al cargar inspecciones</h3>
              <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">No se pudieron obtener los datos. Intenta nuevamente.</p>
            </div>
            <wa-button variant="brand" appearance="accent" size="medium" @click=${() => this.inspeccionesTask.loadDocuments()}>
              <wa-icon slot="start" name="arrow-rotate-right"></wa-icon>
              Reintentar
            </wa-button>
          </div>
        </wa-card>
      `,
      complete: (inspecciones) => {
        const filtrados = this.mostrarInactivos ? inspecciones : inspecciones.filter((i) => i.anulada !== true);
        if (inspecciones.length === 0) {
          return html`
            <wa-card appearance="filled-outlined">
              <div class="wa-stack wa-align-items-center wa-text-center wa-gap-m" style="padding: var(--wa-space-xl) var(--wa-space-l);">
                <wa-icon name="clipboard-check" class="wa-color-text-quiet" style="font-size: 2.5rem;"></wa-icon>
                <div class="wa-stack wa-gap-2xs">
                  <h3 class="wa-heading-m" style="margin: 0;">No hay inspecciones registradas</h3>
                  <p class="wa-body-s wa-color-text-quiet" style="margin: 0;">Registra la primera revisión sanitaria de tus colmenas en campo.</p>
                </div>
                <wa-button id="btn-nueva-inspeccion-empty" variant="brand" appearance="accent" size="medium" @click=${() => this.navigateTo(ROUTES.INSPECCION)}>
                  <wa-icon slot="start" name="circle-plus"></wa-icon>
                  Nueva inspección
                </wa-button>
              </div>
            </wa-card>
          `;
        }

        return html`
          <div class="wa-split wa-align-items-center">
            <wa-checkbox
              hint="Incluye inspecciones anuladas"
              ?checked=${this.mostrarInactivos}
              @change=${(e: Event) => (this.mostrarInactivos = (e.target as HTMLInputElement).checked)}
            >
              <wa-icon slot="start" name="eye"></wa-icon>
              Mostrar anuladas
            </wa-checkbox>
            <wa-button
              id="btn-nueva-inspeccion"
              variant="brand"
              appearance="accent"
              size="medium"
              @click=${() => this.navigateTo(ROUTES.INSPECCION)}
            >
              <wa-icon slot="start" name="circle-plus"></wa-icon>
              Nueva inspección
            </wa-button>
          </div>

          <div class="wa-stack wa-gap-m">
            ${filtrados.length === 0 && !this.mostrarInactivos
              ? html`<p class="wa-body-s wa-color-text-quiet" style="text-align: center;">No hay inspecciones activas.</p>`
              : filtrados.map(
                  (inspeccion) => html`
                    <inspeccion-card
                      .inspeccion=${inspeccion}
                      .colmenas=${this.colmenasTask.value}
                      .apiarios=${this.apiariosTask.value}
                      .deleting=${this.deletingId === inspeccion.id}
                      @anular=${(e: CustomEvent) => this.handleAnularInspeccion(inspeccion, e.detail.motivo)}
                    ></inspeccion-card>
                  `
                )}
          </div>
        `;
      },
    });
  }

  private navigateTo(route: string) {
    dispatchNavigate(this, route);
  }

  override render() {
    let content;
    if (this.type === "inspecciones") {
      content = this.renderInspeccionesTab();
    } else if (this.type === "colmenas") {
      content = this.renderColmenasTab();
    } else {
      content = this.renderApiariosTab();
    }

    return html`
      <div class="wa-stack wa-gap-m">
        <div id="listado-feedback" aria-live="polite">
          ${this.feedback.render()}
        </div>

        ${content}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "listado-view": ListadoView;
  }
}
