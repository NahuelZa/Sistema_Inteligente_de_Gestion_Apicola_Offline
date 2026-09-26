import { LitElement, html } from "lit";
import { FeedbackController } from "../../controllers";
import { customElement, state } from "lit/decorators.js";
import { apiarioService, authService } from "../../services";
import type { Apiario } from "../../models";
import { ROUTES } from "../../constants";
import { dispatchNavigate } from "../../utils";

/**
 * Vista de Alta de Apiario
 */
@customElement("formulario-apiario")
export class FormularioApiario extends LitElement {
  @state() private loading = false;
  private feedback = new FeedbackController(this);

  override createRenderRoot() {
    return this;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const nombreInput = form.querySelector<any>("#apiario-nombre")!;
    const ubicacionInput = form.querySelector<any>("#apiario-ubicacion")!;
    const descTextarea = form.querySelector<any>("#apiario-descripcion")!;

    const nombre = nombreInput.value.trim();
    const ubicacion = ubicacionInput.value.trim();
    const notas = descTextarea.value.trim();


    const userId = authService.getCurrentUserId()!;
    const nuevoApiario: Apiario = {
      userId,
      nombre,
      ubicacion,
      notas,
      createdAtLocal: new Date().toISOString(),
    };

    try {
      this.loading = true;
      await apiarioService.create(nuevoApiario);
      this.feedback.show(`¡Apiario "${nombre}" creado correctamente!`, "success");

      nombreInput.value = "";
      ubicacionInput.value = "";
      descTextarea.value = "";
    } catch (error) {
      console.error("Error al guardar apiario:", error);
      this.feedback.show("Error al registrar el apiario. Se guardará localmente.", "warning");
    } finally {
      this.loading = false;
    }
  }

  private navigateToListado(): void {
    dispatchNavigate(this, ROUTES.LISTADO_APIARIOS);
  }

  override render() {
    return html`
      <form id="form-nuevo-apiario" class="beekeep-form" @submit=${this.handleSubmit}>
        <div class="form-group">
          <wa-input
            id="apiario-nombre"
            name="nombre"
            placeholder="Nombre del apiario"
            required
            with-clear
            size="medium"
          >
            <span slot="label" class="field-label">
              Nombre del apiario
            </span>
          </wa-input>
        </div>

        <div class="form-group">
          <wa-input
            id="apiario-ubicacion"
            name="ubicacion"
            label="Ubicación"
            placeholder="Ubicación o referencia"
            with-clear
            size="medium"
          >
          </wa-input>
        </div>

        <div class="form-group">
          <wa-textarea
            id="apiario-descripcion"
            name="notas"
            label="Descripción / Notas"
            placeholder="Descripción o notas del terreno..."
            rows="3"
            size="medium"
          >
          </wa-textarea>
        </div>

        <div id="apiario-feedback" class="feedback-container" aria-live="polite">
          ${this.feedback.render()}
        </div>

        <div class="form-actions" style="display: flex; gap: var(--wa-space-s);">
          <wa-button
            id="apiario-submit-btn"
            type="submit"
            variant="brand"
            appearance="accent"
            size="large"
            class="beekeep-btn-submit"
            ?loading=${this.loading}
          >
            <wa-icon slot="start" name="circle-plus"></wa-icon>
            Crear apiario
          </wa-button>
          <wa-button
            id="apiario-cancel-btn"
            type="button"
            variant="neutral"
            appearance="outlined"
            size="large"
            @click=${() => this.navigateToListado()}
          >
            Volver
          </wa-button>
        </div>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "formulario-apiario": FormularioApiario;
  }
}
