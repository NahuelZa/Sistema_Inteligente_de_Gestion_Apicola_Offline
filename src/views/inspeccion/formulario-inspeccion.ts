import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { FeedbackController } from "../../controllers";
import { inspeccionService, authService } from "../../services";
import type { Apiario, Colmena, Inspeccion,  } from "../../models";
import type { DocumentWithId } from "../../services";
import { ROUTES } from "../../constants";
import { dispatchNavigate } from "../../utils";

/**
 * Vista de Registro de Inspección de Colmena en Campo.
 * Diseñada para máxima ergonomía táctil en condiciones offline.
 */
@customElement("formulario-inspeccion")
export class FormularioInspeccion extends LitElement {
  @property({ type: Array }) colmenas: DocumentWithId<Colmena>[] = [];
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

  private getApiarioName(apiarioId: string): string {
    return this.apiarios.find((a) => a.id === apiarioId)!.nombre;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const colmenaSelect = form.querySelector<any>("#inspeccion-colmena")!;
    const fechaInput = form.querySelector<any>("#inspeccion-fecha")!;
    const poblacionSelect = form.querySelector<any>("#inspeccion-poblacion")!;
    const reinaCheckbox = form.querySelector<any>("#inspeccion-reina")!;
    const posturaCheckbox = form.querySelector<any>("#inspeccion-postura")!;
    const sanidadSelect = form.querySelector<any>("#inspeccion-sanidad")!;
    const enfermedadesInput = form.querySelector<any>("#inspeccion-enfermedades")!;
    const notasTextarea = form.querySelector<any>("#inspeccion-notas")!;

    const colmenaId = colmenaSelect.value.trim();
    const fecha = fechaInput.value.trim();
    const poblacion = poblacionSelect.value.trim() as "baja" | "media" | "alta";
    const reinaVista = reinaCheckbox.checked;
    const tienePostura = posturaCheckbox.checked;
    const estadoSanitario = sanidadSelect.value.trim() as "bueno" | "alerta" | "enferma";
    const enfermedadesDetectadas = enfermedadesInput.value.trim();
    const notas = notasTextarea.value.trim();

    const selectedColmena = this.colmenas.find((c) => c.id === colmenaId)!;
    const colmenaNumero = selectedColmena.numeroColmena;
    const apiarioId = selectedColmena.apiarioId;

    const nuevaInspeccion: Inspeccion = {
      userId: authService.getCurrentUserId(),
      colmenaId,
      apiarioId,
      fecha,
      poblacion,
      reinaVista,
      tienePostura,
      estadoSanitario,
      enfermedadesDetectadas,
      notas,
      createdAtLocal: new Date().toISOString(),
    };

    try {
      this.loading = true;
      await inspeccionService.create(nuevaInspeccion);
      this.feedback.show(`¡Inspección para la colmena "${colmenaNumero}" registrada correctamente!`, "success");

      colmenaSelect.value = "";
      fechaInput.value = this.today;
      poblacionSelect.value = "media";
      reinaCheckbox.checked = false;
      posturaCheckbox.checked = false;
      sanidadSelect.value = "bueno";
      enfermedadesInput.value = "";
      notasTextarea.value = "";
    } catch (error) {
      console.error("Error al guardar inspección:", error);
      this.feedback.show("Error al registrar la inspección. Se guardará localmente en el dispositivo.", "warning");
    } finally {
      this.loading = false;
    }
  }

  private navigateToListado(): void {
    dispatchNavigate(this, ROUTES.LISTADO_INSPECCIONES);
  }

  override render() {
    return html`
      <form id="form-nueva-inspeccion" class="beekeep-form" @submit=${this.handleSubmit}>
        <div class="form-group">
          <wa-select
            id="inspeccion-colmena"
            name="colmenaId"
            placeholder="Seleccione la colmena a revisar"
            required
            with-clear
            size="medium"
          >
            <span slot="label" class="field-label">Colmena a inspeccionar</span>
            ${this.colmenas.map(
              (c) =>
                html`<wa-option value=${c.id}>
                  ${c.numeroColmena} (${this.getApiarioName(c.apiarioId)})
                </wa-option>`
            )}
          </wa-select>
        </div>

        <div class="form-group">
          <wa-input
            id="inspeccion-fecha"
            name="fecha"
            type="date"
            label="Fecha de la inspección"
            value=${this.today}
            size="medium"
            required
          ></wa-input>
        </div>

        <div class="form-group">
          <wa-select
            id="inspeccion-poblacion"
            name="poblacion"
            value="media"
            size="medium"
            required
          >
            <span slot="label" class="field-label">Nivel de Población</span>
            <wa-option value="baja">Baja</wa-option>
            <wa-option value="media">Media (Normal)</wa-option>
            <wa-option value="alta">Alta (Fuerte)</wa-option>
          </wa-select>
        </div>

        <div class="form-group" style="display: flex; flex-direction: column; gap: var(--wa-space-s); padding: var(--wa-space-s) 0;">
          <wa-checkbox id="inspeccion-reina" name="reinaVista" size="large">
            <span style="font-weight: var(--wa-font-weight-medium); font-size: 1.05rem;">👑 Reina vista</span>
          </wa-checkbox>

          <wa-checkbox id="inspeccion-postura" name="tienePostura" size="large">
            <span style="font-weight: var(--wa-font-weight-medium); font-size: 1.05rem;">🥚 Tiene postura / Cría presente</span>
          </wa-checkbox>
        </div>

        <div class="form-group">
          <wa-select
            id="inspeccion-sanidad"
            name="estadoSanitario"
            value="bueno"
            size="medium"
            required
          >
            <span slot="label" class="field-label">Estado Sanitario General</span>
            <wa-option value="bueno">Bueno / Saludable</wa-option>
            <wa-option value="alerta">Alerta / Observación</wa-option>
            <wa-option value="enferma">Enferma / Tratamiento Requerido</wa-option>
          </wa-select>
        </div>

        <div class="form-group">
          <wa-input
            id="inspeccion-enfermedades"
            name="enfermedadesDetectadas"
            placeholder="Ej: Varroa, Loque americana, etc."
            with-clear
            size="medium"
          >
            <span slot="label" class="field-label">Enfermedades o plagas (opcional)</span>
          </wa-input>
        </div>

        <div class="form-group">
          <wa-textarea
            id="inspeccion-notas"
            name="notas"
            label="Notas y observaciones de campo"
            placeholder="Escribí las observaciones sanitarias o de manejo..."
            rows="3"
            size="medium"
          ></wa-textarea>
        </div>

        <div id="inspeccion-feedback" class="feedback-container" aria-live="polite">
          ${this.feedback.render()}
        </div>

        <div class="form-actions" style="display: flex; gap: var(--wa-space-s);">
          <wa-button
            id="inspeccion-submit-btn"
            type="submit"
            variant="brand"
            appearance="accent"
            size="large"
            class="beekeep-btn-submit"
            ?loading=${this.loading}
          >
            <wa-icon slot="start" name="circle-check"></wa-icon>
            Guardar inspección
          </wa-button>
          <wa-button
            id="inspeccion-cancel-btn"
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
    "formulario-inspeccion": FormularioInspeccion;
  }
}
