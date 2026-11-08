import {html, LitElement} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {FeedbackController} from "../../controllers";
import type {DocumentWithId} from "../../services";
import {trasladoService} from "../../services";
import type {Apiario, Colmena} from "../../models";
import {MOTIVOS_TRASLADO} from "../../models";
import {ROUTES} from "../../constants";
import {dispatchNavigate, getTodayDateString} from "../../utils";

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
      this.selectedColmenas = [this.colmenaId];
    }
  }

  private get today(): string {
    return getTodayDateString();
  }

  private get selectedColmenasList(): DocumentWithId<Colmena>[] {
    return this.colmenas.filter((c) => this.selectedColmenas.includes(c.id));
  }

  private get motivosTraslado() {
    return MOTIVOS_TRASLADO;
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

    const destinoApiario = this.apiarios?.find((a) => a.id === apiarioDestinoId);
    const destinoNombre = destinoApiario?.nombre ?? "Apiario desconocido";

    try {
      this.loading = true;

      await trasladoService.trasladarColmenas({
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
    this.selectedColmenas = selectedIds;
  }

  private navigateToListado(): void {
    dispatchNavigate(this, ROUTES.LISTADO_COLMENAS);
  }

  private getApiarioNombre(apiarioId: string): string {
    const apiario = this.apiarios?.find((a) => a.id === apiarioId);
    return apiario ? apiario.nombre : "Apiario desconocido";
  }

  override render() {
    const selectedColmenas = this.selectedColmenasList;
    // Filtrar apiarios de destino: excluir los apiarios de origen de las colmenas seleccionadas
    const origenApiarioIds = selectedColmenas.map((c) => c.apiarioId);
    const apiariosDestino = this.apiarios.filter((a) => !origenApiarioIds.includes(a.id));

    return html`
      <div class="wa-stack" style="gap: var(--wa-space-l);">
        <form id="form-traslado" data-testid="form-traslado" class="beekeep-form" @submit=${this.handleSubmit}>
          <div class="form-group">
            <wa-select id="traslado-colmena" data-testid="traslado-colmena" name="colmenaId" placeholder="Seleccioná una o más colmenas" required with-clear size="m" multiple .value=${this.selectedColmenas} @change=${this.handleColmenaChange}>
              <span slot="label" class="field-label">Colmenas</span>
              ${this.colmenas.map(
                (c) => html`<wa-option value=${c.id} ?selected=${this.selectedColmenas.includes(c.id)}>${c.numeroColmena} — ${this.getApiarioNombre(c.apiarioId)}</wa-option>`
              )}
            </wa-select>
          </div>

          <div class="form-group">
            <wa-select id="traslado-destino" data-testid="traslado-destino" name="apiarioDestinoId" placeholder="Seleccioná el apiario de destino" required with-clear size="m">
              <span slot="label" class="field-label">Apiario de destino</span>
              ${apiariosDestino.map(
                (a) => html`<wa-option value=${a.id}>${a.nombre}</wa-option>`
              )}
            </wa-select>
          </div>

          <div class="form-group">
            <wa-input id="traslado-fecha" data-testid="traslado-fecha" name="fecha" type="date" label="Fecha del traslado" value=${this.today} size="m" required></wa-input>
          </div>

          <div class="form-group">
            <wa-select id="traslado-motivo" data-testid="traslado-motivo" name="motivo" placeholder="Seleccioná el motivo" required with-clear size="m">
              <span slot="label" class="field-label">Motivo del traslado</span>
              ${this.motivosTraslado.map(
                (m) => html`<wa-option value=${m.value}>${m.label}</wa-option>`
              )}
            </wa-select>
          </div>

          <div class="form-group">
            <wa-textarea id="traslado-notas" data-testid="traslado-notas" name="notas" label="Notas complementarias" placeholder="Detalles adicionales sobre el traslado..." rows="3" size="m"></wa-textarea>
          </div>

          <div id="traslado-feedback" data-testid="traslado-feedback" class="feedback-container" aria-live="polite">
            ${this.feedback.render()}
          </div>

          <div class="form-actions" style="display: flex; gap: var(--wa-space-s);">
            <wa-button id="traslado-submit-btn" data-testid="traslado-submit-btn" type="submit" variant="brand" appearance="accent" class="beekeep-btn-submit" ?loading=${this.loading}>
              <wa-icon slot="start" name="truck"></wa-icon>
              Registrar traslado
            </wa-button>
            <wa-button
              id="traslado-cancel-btn"
              data-testid="traslado-cancel-btn"
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
