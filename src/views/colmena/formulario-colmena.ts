import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { FeedbackController } from "../../controllers";
import { colmenaService, authService } from "../../services";
import type { Colmena, Apiario } from "../../models";
import type { DocumentWithId } from "../../services";
import { ROUTES } from "../../constants";
import { dispatchNavigate } from "../../utils";

/**
 * Vista de Alta de Colmena
 */
@customElement("formulario-colmena")
export class FormularioColmena extends LitElement {
  @property({ type: Array }) apiarios: DocumentWithId<Apiario>[] = [];
  @state() private loading = false;

  private feedback = new FeedbackController(this);

  override createRenderRoot() {
    return this;
  }

  private get today(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const apiarioSelect = form.querySelector<any>("#colmena-apiario")!;
    const numeroInput = form.querySelector<any>("#colmena-numero")!;
    const fechaInput = form.querySelector<any>("#colmena-fecha")!;
    const notasTextarea = form.querySelector<any>("#colmena-notas")!;

    const apiarioId = apiarioSelect.value.trim();
    const apiarioNombre = this.apiarios.find((apiario) => apiario.id === apiarioId)?.nombre ?? "";
    console.log(apiarioNombre);
    const numeroColmena = numeroInput.value.trim();
    const fechaAlta = fechaInput.value.trim();
    const notas = notasTextarea.value.trim();


    const userId = authService.getCurrentUserId()!;
    const nuevaColmena: Colmena = {
      userId,
      apiarioId,
      apiarioNombre,
      numeroColmena,
      fechaAlta,
      estado: "activa",
      notas,
      createdAtLocal: new Date().toISOString(),
    };

    try {
      this.loading = true;
      await colmenaService.create(nuevaColmena);
      this.feedback.show(`¡Colmena "${numeroColmena}" guardada con éxito en ${apiarioNombre}!`, "success");

      apiarioSelect.value = "";
      numeroInput.value = "";
      fechaInput.value = this.today;
      notasTextarea.value = "";
    } catch (error) {
      console.error("Error al guardar colmena:", error);
      this.feedback.show("Error al registrar la colmena. Se guardará localmente.", "warning");
    } finally {
      this.loading = false;
    }
  }

  private navigateToListado(): void {
    dispatchNavigate(this, ROUTES.LISTADO_COLMENAS);
  }

  override render() {
    return html`
      <form id="form-nueva-colmena" class="beekeep-form" @submit=${this.handleSubmit}>
        <div class="form-group">
          <wa-select id="colmena-apiario" name="apiarioId" placeholder="Seleccione un apiario" required with-clear size="medium">
            <span slot="label" class="field-label">Apiario</span>
            ${this.apiarios.map(
              (a) => html`<wa-option value=${a.id}>${a.nombre}</wa-option>`
            )}
          </wa-select>
        </div>

        <div class="form-group">
          <wa-input id="colmena-numero" name="numeroColmena" placeholder="Ej: COL-014" required with-clear size="medium">
            <span slot="label" class="field-label">Número de colmena</span>
          </wa-input>
        </div>

        <div class="form-group">
          <wa-input id="colmena-fecha" name="fechaAlta" type="date" label="Fecha de alta" value=${this.today} size="medium" required></wa-input>
        </div>

        <div class="form-group">
          <wa-textarea id="colmena-notas" name="notas" label="Notas" placeholder="Escribí o dictá la observación..." rows="3" size="medium"></wa-textarea>
        </div>

        <div id="colmena-feedback" class="feedback-container" aria-live="polite">
          ${this.feedback.render()}
        </div>

        <div class="form-actions" style="display: flex; gap: var(--wa-space-s);">
          <wa-button id="colmena-submit-btn" type="submit" variant="brand" appearance="accent" size="large" class="beekeep-btn-submit" ?loading=${this.loading}>
            <wa-icon slot="start" name="circle-check"></wa-icon>
            Guardar
          </wa-button>
          <wa-button
            id="colmena-cancel-btn"
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
    "formulario-colmena": FormularioColmena;
  }
}
