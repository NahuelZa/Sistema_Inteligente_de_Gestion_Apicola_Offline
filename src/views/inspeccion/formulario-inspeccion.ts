import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { FeedbackController } from "../../controllers";
import { inspeccionService, authService } from "../../services";
import type { Apiario, Colmena, Inspeccion,  } from "../../models";
import type { DocumentWithId } from "../../services";
import { ROUTES } from "../../constants";
import { dispatchNavigate, getTodayDateString } from "../../utils";
/**
 * Datos extraídos del formulario de inspección.
 */
interface InspeccionFormData {
  colmenaId: string;
  fecha: string;
  poblacion: "baja" | "media" | "alta";
  reinaVista: boolean;
  tienePostura: boolean;
  estadoSanitario: "bueno" | "alerta" | "enferma";
  enfermedadesDetectadas: string;
  notas: string;
  esOnline: boolean;
}

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
    return getTodayDateString();
  }

  private getApiarioName(apiarioId: string): string {
    const apiario = this.apiarios?.find((a) => a.id === apiarioId);
    return apiario ? apiario.nombre : 'Sin apiario';
  }



  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    try {
      this.loading = true;
      const datos = this.extraerDatosFormulario(form);
      const inspeccion = this.construirInspeccion(datos);
      const mensaje = await this.guardarInspeccion(inspeccion, datos);
      this.feedback.show(mensaje, datos.esOnline ? "success" : "warning");
      this.resetearFormulario(form);
    } catch (error) {
      console.error("Error al guardar inspección:", error);
      this.feedback.show("Error al registrar la inspección. Se guardará localmente en el dispositivo.", "warning");
    } finally {
      this.loading = false;
    }
  }

  private extraerDatosFormulario(form: HTMLFormElement): InspeccionFormData {
    const getValorTrim = (selector: string) => (form.querySelector<any>(selector)?.value ?? "").trim();
    const getCheckbox = (selector: string) => !!form.querySelector<any>(selector)?.checked;

    return {
      colmenaId: getValorTrim("#inspeccion-colmena"),
      fecha: getValorTrim("#inspeccion-fecha"),
      poblacion: getValorTrim("#inspeccion-poblacion") as "baja" | "media" | "alta",
      reinaVista: getCheckbox("#inspeccion-reina"),
      tienePostura: getCheckbox("#inspeccion-postura"),
      estadoSanitario: getValorTrim("#inspeccion-sanidad") as "bueno" | "alerta" | "enferma",
      enfermedadesDetectadas: getValorTrim("#inspeccion-enfermedades") || "Ninguna detectada",
      notas: getValorTrim("#inspeccion-notas"),
      esOnline: navigator.onLine,
    };
  }

  private construirInspeccion(datos: InspeccionFormData): Inspeccion {
    const selectedColmena = this.colmenas?.find((c) => c.id === datos.colmenaId);
    const userId = authService.getCurrentUserId()!;

    return {
      userId,
      colmenaId: datos.colmenaId,
      apiarioId: selectedColmena?.apiarioId ?? "",
      fecha: datos.fecha,
      poblacion: datos.poblacion,
      reinaVista: datos.reinaVista,
      tienePostura: datos.tienePostura,
      estadoSanitario: datos.estadoSanitario,
      enfermedadesDetectadas: datos.enfermedadesDetectadas,
      notas: datos.notas,
      createdAtLocal: new Date().toISOString(),
    };
  }

  private async guardarInspeccion(
    inspeccion: Inspeccion,
    datos: InspeccionFormData
  ): Promise<string> {
    const selectedColmena = this.colmenas?.find((c) => c.id === datos.colmenaId);
    const colmenaNumero = selectedColmena?.numeroColmena ?? "Desconocida";

    if (datos.esOnline) {
      await inspeccionService.create(inspeccion);
      return `¡Inspección para la colmena "${colmenaNumero}" registrada y sincronizada con éxito!`;
    } else {
      inspeccionService.create(inspeccion);
      return "Guardado localmente en el dispositivo. Pendiente de sincronización al recuperar señal.";
    }
  }

  private resetearFormulario(form: HTMLFormElement): void {
    const colmenaSelect = form.querySelector<any>("#inspeccion-colmena")!;
    const fechaInput = form.querySelector<any>("#inspeccion-fecha")!;
    const poblacionSelect = form.querySelector<any>("#inspeccion-poblacion")!;
    const reinaCheckbox = form.querySelector<any>("#inspeccion-reina")!;
    const posturaCheckbox = form.querySelector<any>("#inspeccion-postura")!;
    const sanidadSelect = form.querySelector<any>("#inspeccion-sanidad")!;
    const enfermedadesInput = form.querySelector<any>("#inspeccion-enfermedades")!;
    const notasTextarea = form.querySelector<any>("#inspeccion-notas")!;
    colmenaSelect.value = "";
    fechaInput.value = this.today;
    poblacionSelect.value = "media";
    reinaCheckbox.checked = false;
    posturaCheckbox.checked = false;
    sanidadSelect.value = "bueno";
    enfermedadesInput.value = "";
    notasTextarea.value = "";
  }

  private navigateToListado(): void {
    dispatchNavigate(this, ROUTES.LISTADO_INSPECCIONES);
  }

  override render() {
    return html`
      <form id="form-nueva-inspeccion" data-testid="form-nueva-inspeccion" class="beekeep-form" @submit=${this.handleSubmit}>
        <div class="form-group">
          <wa-select
            id="inspeccion-colmena"
            data-testid="inspeccion-colmena"
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
            data-testid="inspeccion-fecha"
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
            data-testid="inspeccion-poblacion"
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
          <wa-checkbox id="inspeccion-reina" data-testid="inspeccion-reina" name="reinaVista" size="large">
            <span style="font-weight: var(--wa-font-weight-medium); font-size: 1.05rem;">👑 Reina vista</span>
          </wa-checkbox>

          <wa-checkbox id="inspeccion-postura" data-testid="inspeccion-postura" name="tienePostura" size="large">
            <span style="font-weight: var(--wa-font-weight-medium); font-size: 1.05rem;">🥚 Tiene postura / Cría presente</span>
          </wa-checkbox>
        </div>

        <div class="form-group">
          <wa-select
            id="inspeccion-sanidad"
            data-testid="inspeccion-sanidad"
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
            data-testid="inspeccion-enfermedades"
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
            data-testid="inspeccion-notas"
            name="notas"
            label="Notas y observaciones de campo"
            placeholder="Escribí las observaciones sanitarias o de manejo..."
            rows="3"
            size="medium"
          ></wa-textarea>
        </div>

        <div id="inspeccion-feedback" data-testid="inspeccion-feedback" class="feedback-container" aria-live="polite">
          ${this.feedback.render()}
        </div>

        <div class="form-actions" style="display: flex; gap: var(--wa-space-s);">
          <wa-button
            id="inspeccion-submit-btn"
            data-testid="inspeccion-submit-btn"
            type="submit"
            variant="brand"
            appearance="accent"
            class="beekeep-btn-submit"
            ?loading=${this.loading}
          >
            <wa-icon slot="start" name="circle-check"></wa-icon>
            Guardar
          </wa-button>
          <wa-button
            id="inspeccion-cancel-btn"
            data-testid="inspeccion-cancel-btn"
            type="button"
            variant="neutral"
            appearance="outlined"
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
