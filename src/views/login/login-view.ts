import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { FeedbackController } from "../../controllers";
import { authService } from "../../services";
import { ROUTES } from "../../constants";
import { dispatchNavigate } from "../../utils";

/**
 * Vista de inicio de sesión y registro para BeeKeep.
 * Permite al usuario iniciar sesión o crear una nueva cuenta con Firebase Auth.
 */
@customElement("login-view")
export class LoginView extends LitElement {
  @state() private mode: "login" | "register" = "login";
  @state() private loading = false;
  private feedback = new FeedbackController(this);

  override createRenderRoot() {
    return this;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const emailInput = form.querySelector<any>("#auth-email")!;
    const passwordInput = form.querySelector<any>("#auth-password")!;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      this.feedback.show("Completá el email y la contraseña.", "warning");
      return;
    }

    try {
      this.loading = true;

      if (this.mode === "login") {
        await authService.login(email, password);
        this.feedback.show("¡Bienvenido!", "success");
      } else {
        await authService.register(email, password);
        this.feedback.show("¡Cuenta creada! Ya estás conectado.", "success");
      }

      // Redirigir a la vista principal después del login exitoso
      setTimeout(() => {
        dispatchNavigate(this, ROUTES.LISTADO_APIARIOS);
      }, 500);
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      const message = this.getAuthErrorMessage(error?.code);
      this.feedback.show(message, "danger");
    } finally {
      this.loading = false;
    }
  }

  private toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login";
    this.feedback.clear();
  }

  private getAuthErrorMessage(code: string): string {
    switch (code) {
      case "auth/email-already-in-use":
        return "Este email ya está registrado. Usá otro o iniciá sesión.";
      case "auth/invalid-email":
        return "El email no es válido.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
      case "auth/user-not-found":
        return "No hay cuenta con ese email.";
      case "auth/wrong-password":
        return "La contraseña es incorrecta.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Intentá más tarde.";
      default:
        return "Error al conectar. Verificá tus datos e intentá de nuevo.";
    }
  }

  override render() {
    const title = this.mode === "login" ? "Iniciar sesión" : "Crear cuenta";
    const submitLabel = this.mode === "login" ? "Iniciar sesión" : "Crear cuenta";
    const toggleLabel = this.mode === "login" ? "¿No tenés cuenta? Creá una" : "¿Ya tenés cuenta? Iniciá sesión";

    return html`
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <span class="login-logo">🐝</span>
            <h2 class="wa-heading-lg wa-font-weight-bold">${title}</h2>
            <p class="login-subtitle">BeeKeep — Gestión de apiarios</p>
          </div>

          <form id="form-auth" class="beekeep-form" @submit=${this.handleSubmit}>
            <div class="form-group">
              <wa-input
                id="auth-email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                with-clear
                size="medium"
              >
                <span slot="label" class="field-label">Email</span>
              </wa-input>
            </div>

            <div class="form-group">
              <wa-input
                id="auth-password"
                name="password"
                type="password"
                placeholder="Contraseña"
                required
                size="medium"
              >
                <span slot="label" class="field-label">Contraseña</span>
              </wa-input>
            </div>

            <div id="auth-feedback" class="feedback-container" aria-live="polite">
              ${this.feedback.render()}
            </div>

            <div class="form-actions" style="display: flex; flex-direction: column; gap: var(--wa-space-s);">
              <wa-button
                id="auth-submit-btn"
                type="submit"
                variant="brand"
                appearance="accent"
                size="large"
                class="beekeep-btn-submit"
                ?loading=${this.loading}
                style="width: 100%;"
              >
                <wa-icon slot="start" name="arrow-right-to-bracket"></wa-icon>
                ${submitLabel}
              </wa-button>

              <wa-button
                type="button"
                variant="neutral"
                appearance="outlined"
                size="medium"
                @click=${() => this.toggleMode()}
                style="width: 100%;"
              >
                ${toggleLabel}
              </wa-button>
            </div>
          </form>
        </div>
      </div>

      <style>
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          width: 100%;
        }

        .login-card {
          background: var(--wa-color-neutral-fill-quiet, #fff);
          border: 1px solid var(--wa-color-neutral-border-muted, #e5e7eb);
          border-radius: var(--wa-radius-l, 12px);
          padding: var(--wa-space-xl, 32px);
          max-width: 420px;
          width: 100%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--wa-space-l, 24px);
        }

        .login-logo {
          font-size: 48px;
          display: block;
          margin-bottom: var(--wa-space-s, 8px);
        }

        .login-subtitle {
          color: var(--wa-color-neutral-fill, #6b7280);
          margin: var(--wa-space-xs, 4px) 0 0;
          font-size: 14px;
        }
      </style>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "login-view": LoginView;
  }
}
