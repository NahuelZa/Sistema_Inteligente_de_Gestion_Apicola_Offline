import {html, LitElement} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {FeedbackController} from "../../controllers";
import type {DocumentWithId} from "../../services";
import {colmenaService} from "../../services";
import type {Apiario, Colmena} from "../../models";
import {ROUTES} from "../../constants";
import {dispatchNavigate} from "../../utils";

/**
 * Vista de Traslado de Colmenas
 * Permite registrar un traslado (individual o en lote) de colmenas entre apiarios.
 * Soporta selección múltiple y pre-selección desde la URL.
 */
@customElement("formulario-traslado")
export class FormularioTraslado extends LitElement {
  @property({ type: Array }) colmenas: DocumentWithId<Colmena>[] = [];
  @property({ type: Array }) apiarios: DocumentWithId<Apiario>[] = [];
  @property({ type: String, attribute: 'colmena-id' }) colmenaId: string | null = null;
  @state() private loading = false;
  @state() private selectedColmenas: string[] = [];

  private feedback = new FeedbackController(this);

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    // Leer colmena pre-seleccionada desde query param de la URL
    if (this.colmenaId) {
      this.selectedColmenas = [this.colmenaId.toLowerCase()];
    }
  }

  private get today(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private get selectedColmenasList(): DocumentWithId<Colmena>[] {
    return this.colmenas.filter((c) => this.selectedColmenas.includes(c.id));
  }

  private get motivosTraslado(): { value: string; label: string }[] {
    return [
      { value: "Floración / Trashumancia", label: "Floración / Trashumancia" },
      { value: "Sanidad / Aislamiento", label: "Sanidad / Aislamiento" },
      { value: "Fusión de colmenares", label: "Fusión de colmenares" },
      { value: "Optimización de espacio", label: "Optimización de espacio" },
      { value: "Otro", label: "Otro" },
    ];
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const colmenaSelect = form.querySelector<any>("#traslado-colmena")!;
    const destinoSelect = form.querySelector<any>("#traslado-destino")!;
    const fechaInput = form.querySelector<any>("#traslado-fecha")!;
    const motivoSelect = form.querySelector<any>("#traslado-motivo")!;
    const notasTextarea = form.querySelector<any>("#traslado-notas")!;

    const selectedIds: string[] = Array.isArray(colmenaSelect.value) ? colmenaSelect.value : [];
    const apiarioDestinoId = destinoSelect.value.trim();
    const fecha = fechaInput.value.trim();
    const motivo = motivoSelect.value.trim();
    const notas = notasTextarea.value.trim();

    if (!selectedIds.length) {
      this.feedback.show("Seleccioná al menos una colmena.", "danger");
      return;
    }

    if (!apiarioDestinoId) {
      this.feedback.show("Seleccioná un apiario de destino.", "danger");
      return;
    }

    const colmenasSeleccionadas = this.colmenas.filter((c) => selectedIds.includes(c.id));
    if (colmenasSeleccionadas.length === 0) {
      this.feedback.show("Seleccioná colmenas válidas.", "danger");
      return;
    }

    // Validar que ninguna colmena ya está en el apiario de destino
    const yaEnDestino = colmenasSeleccionadas.filter((c) => c.apiarioId === apiarioDestinoId);
    if (yaEnDestino.length > 0) {
      const numeros = yaEnDestino.map((c) => c.numeroColmena).join(", ");
      this.feedback.show(`Las colmenas ${numeros} ya se encuentran en el apiario de destino.`, "danger");
      return;
    }

    const destinoApiario = this.apiarios.find((a) => a.id === apiarioDestinoId);
    const destinoNombre = destinoApiario?.nombre ?? "Apiario desconocido";

    try {
      this.loading = true;

      await colmenaService.trasladarColmenas({
        colmenas: colmenasSeleccionadas.map((c) => ({
          colmenaId: c.id,
          apiarioOrigenId: c.apiarioId,
        })),
        apiarioDestinoId,
        fecha,
        motivo,
        notas,
      });

      if (navigator.onLine) {
        this.feedback.show(
          `¡${colmenasSeleccionadas.length} colmena(s) trasladada(s) a ${destinoNombre} con éxito!`,
          "success"
        );
      } else {
        this.feedback.show(
          "Traslados guardados localmente. Pendientes de sincronización al recuperar señal.",
          "warning"
        );
      }

      // Limpiar formulario
      colmenaSelect.value = [];
      this.selectedColmenas = [];
      destinoSelect.value = "";
      fechaInput.value = this.today;
      motivoSelect.value = "";
      notasTextarea.value = "";
    } catch (error: any) {
      console.error("Error al registrar traslado:", error);
      this.feedback.show(error?.message || "Error al registrar el traslado.", "danger");
    } finally {
      this.loading = false;
    }
  }

  private handleColmenaChange(event: Event): void {
    const select = event.target as any;
    const selectedIds: string[] = Array.isArray(select.value) ? select.value : [];
    this.selectedColmenas = selectedIds.map(each => each.toLowerCase());
  }

  private navigateToListado(): void {
    dispatchNavigate(this, ROUTES.LISTADO_COLMENAS);
  }

  private getApiarioNombre(apiarioId: string): string {
    const apiario = this.apiarios.find((a) => a.id === apiarioId);
    return apiario ? apiario.nombre : "Apiario desconocido";
  }

  override render() {
    const selectedList = this.selectedColmenasList;
    const origenApiarios = selectedList
      .map((c) => this.apiarios.find((a) => a.id === c.apiarioId)?.nombre)
      .filter(Boolean);
    const origenTexto = origenApiarios.length > 0 ? origenApiarios.join(", ") : "";

    // Filtrar apiarios de destino: excluir los apiarios de origen de las colmenas seleccionadas
    const origenApiarioIds = selectedList.map((c) => c.apiarioId);
    const apiariosDestino = this.apiarios.filter((a) => !origenApiarioIds.includes(a.id));

    return html`
      <div class="wa-stack" style="gap: var(--wa-space-l);">
        <form id="form-traslado" class="beekeep-form" @submit=${this.handleSubmit}>
          <div class="form-group">
            <wa-select id="traslado-colmena" name="colmenaId" placeholder="Seleccioná una o más colmenas" required with-clear size="medium" multiple .value=${this.selectedColmenas} @change=${this.handleColmenaChange}>
              <span slot="label" class="field-label">Colmenas</span>
              ${this.colmenas.map(
                (c) => html`<wa-option value=${c.id} ?selected=${this.selectedColmenas.includes(c.id.toLowerCase())}>${c.numeroColmena} — ${this.getApiarioNombre(c.apiarioId)}</wa-option>`
              )}
            </wa-select>
          </div>

          <div class="form-group">
            <wa-input id="traslado-origen" name="apiarioOrigen" label="Apiario de origen" size="medium" readonly value=${origenTexto}>
              <span slot="label" class="field-label">Apiario de origen</span>
            </wa-input>
          </div>

          <div class="form-group">
            <wa-select id="traslado-destino" name="apiarioDestinoId" placeholder="Seleccioná el apiario de destino" required with-clear size="medium">
              <span slot="label" class="field-label">Apiario de destino</span>
              ${apiariosDestino.map(
                (a) => html`<wa-option value=${a.id}>${a.nombre}</wa-option>`
              )}
            </wa-select>
          </div>

          <div class="form-group">
            <wa-input id="traslado-fecha" name="fecha" type="date" label="Fecha del traslado" value=${this.today} size="medium" required></wa-input>
          </div>

          <div class="form-group">
            <wa-select id="traslado-motivo" name="motivo" placeholder="Seleccioná el motivo" required with-clear size="medium">
              <span slot="label" class="field-label">Motivo del traslado</span>
              ${this.motivosTraslado.map(
                (m) => html`<wa-option value=${m.value}>${m.label}</wa-option>`
              )}
            </wa-select>
          </div>

          <div class="form-group">
            <wa-textarea id="traslado-notas" name="notas" label="Notas complementarias" placeholder="Detalles adicionales sobre el traslado..." rows="3" size="medium"></wa-textarea>
          </div>

          <div id="traslado-feedback" class="feedback-container" aria-live="polite">
            ${this.feedback.render()}
          </div>

          <div class="form-actions" style="display: flex; gap: var(--wa-space-s);">
            <wa-button id="traslado-submit-btn" type="submit" variant="brand" appearance="accent" class="beekeep-btn-submit" ?loading=${this.loading}>
              <wa-icon slot="start" name="truck"></wa-icon>
              Registrar traslado
            </wa-button>
            <wa-button
              id="traslado-cancel-btn"
              type="button"
              variant="neutral"
              appearance="outlined"
              @click=${() => this.navigateToListado()}
            >
              Volver
            </wa-button>
          </div>
        </form>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "formulario-traslado": FormularioTraslado;
  }
}
