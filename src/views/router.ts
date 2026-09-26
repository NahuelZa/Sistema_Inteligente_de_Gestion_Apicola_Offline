import { html, LitElement } from "lit";
import { Router } from "@lit-labs/router";
import "@awesome.me/webawesome/dist/components/page/page.js";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import { ROUTES, VIEWS, type ViewType } from "../constants";
import { NAVIGATE_EVENT, type NavigateDetail } from "../utils";
import { apiarioService, colmenaService, authService } from "../services";
import { FirestoreController } from "../controllers";
import "./apiario/formulario-apiario";
import "./colmena/formulario-colmena";
import "./inspeccion/formulario-inspeccion";
import "./listado/listado-view";
import "./login/login-view";
import "./components/sync-indicator";

export type { ViewType };

/**
 * Enrutador principal de la aplicación BeeKeep.
 */
export class AppRouter extends LitElement {
  static override properties = {
    currentView: { type: String },
  };

  private currentView: ViewType;
  private apiariosController = new FirestoreController(this, apiarioService);
  private colmenasController = new FirestoreController(this, colmenaService);

  constructor() {
    super();
    this.currentView = VIEWS.LISTADO_APIARIOS;
  }

  private router = new Router(this, [
    {
      path: ROUTES.LOGIN,
      render: () => html`<login-view></login-view>`,
      enter: () => this.setView(VIEWS.LOGIN),
    },
    {
      path: ROUTES.HOME,
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_APIARIOS)),
    },
    {
      path: ROUTES.APIARIO,
      render: () => html`<formulario-apiario></formulario-apiario>`,
      enter: () => this.requireAuth(() => this.setView(VIEWS.APIARIO)),
    },
    {
      path: ROUTES.COLMENA,
      render: () =>
        html`<formulario-colmena
          .apiarios=${this.apiariosController.value}
        ></formulario-colmena>`,
      enter: () => {
        void this.apiariosController.load();
        return this.requireAuth(() => this.setView(VIEWS.COLMENA));
      },
    },
    {
      path: ROUTES.INSPECCION,
      render: () =>
        html`<formulario-inspeccion
          .colmenas=${this.colmenasController.value}
          .apiarios=${this.apiariosController.value}
        ></formulario-inspeccion>`,
      enter: () => {
        void this.colmenasController.load();
        void this.apiariosController.load();
        return this.requireAuth(() => this.setView(VIEWS.INSPECCION));
      },
    },
    {
      path: ROUTES.NUEVA_INSPECCION,
      render: () =>
        html`<formulario-inspeccion
          .colmenas=${this.colmenasController.value}
          .apiarios=${this.apiariosController.value}
        ></formulario-inspeccion>`,
      enter: () => {
        void this.colmenasController.load();
        void this.apiariosController.load();
        return this.requireAuth(() => this.setView(VIEWS.INSPECCION));
      },
    },
    {
      path: ROUTES.LISTADO_APIARIOS,
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_APIARIOS)),
    },
    {
      path: ROUTES.LISTADO_COLMENAS,
      render: () => html`<listado-view type="colmenas"></listado-view>`,
      enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_COLMENAS)),
    },
    {
      path: ROUTES.LISTADO_INSPECCIONES,
      render: () => html`<listado-view type="inspecciones"></listado-view>`,
      enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_INSPECCIONES)),
    },
    {
      path: ROUTES.LISTADO,
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_APIARIOS)),
    },
  ]);

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener(NAVIGATE_EVENT, this.handleNavigateEvent as EventListener);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(NAVIGATE_EVENT, this.handleNavigateEvent as EventListener);
  }

  private handleNavigateEvent = (e: CustomEvent<NavigateDetail>) => {
    e.stopPropagation();
    if (e.detail?.path) {
      void this.navigate(e.detail.path);
    }
  };

  /**
   * Route guard that redirects to login if the user is not authenticated.
   * Returns `false` to reject the route match when unauthenticated.
   */
  private requireAuth(onSuccess: () => boolean): boolean {
    if (!authService.isAuthenticated()) {
      void this.navigate(ROUTES.LOGIN);
      return false;
    }
    return onSuccess();
  }

  private setView(view: ViewType): boolean {
    this.currentView = view;
    return true;
  }

  public async navigate(pathOrView: string): Promise<void> {
    let target = pathOrView.trim();
    if (!target.startsWith("/")) {
      target = `/${target}`;
    }
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
    }
    await this.router.goto(target);
  }

  override render() {
    return html`
      <wa-page>
        <header slot="header" class="wa-stack view-header" style="gap: var(--wa-space-xs);">
          <div class="wa-cluster wa-align-items-center wa-justify-content-between" style="width: 100%; padding-top: var(--wa-space-xs);">
            <h1
              class="wa-heading-xl wa-font-weight-bold"
              id="${this.currentView}-view-title"
              style="margin: 0; display: flex; align-items: center; gap: var(--wa-space-xs);"
            >
              <span>🐝</span>
              <span>${this.getViewTitle()}</span>
              ${this.currentView !== VIEWS.LOGIN ? html`
              <wa-button
                  variant="neutral"
                  appearance="accent"
                  size="xs"
                  @click=${() => this.handleLogout()}
              >
                <wa-icon slot="start" name="arrow-right-from-bracket"></wa-icon>
                Cerrar sesión
              </wa-button>
            ` : html``}
            </h1>

            <div id="header-sync-container" style="margin-left: auto; display: flex; align-items: center; gap: var(--wa-space-s);">
              <sync-indicator></sync-indicator>

            </div>
          </div>

          <nav aria-label="Selector de vistas" style="width: 100%;">
            <wa-tab-group
              id="view-switcher"
              style="--indicator-color: var(--wa-color-brand-fill-loud); --track-color: transparent; width: 100%;"
              active=${this.currentView}
              @wa-tab-show=${(e: CustomEvent<{ name: string }>) => {
                const target = e.detail?.name;
                void this.navigate(target);
              }}
            >
              <wa-tab
                slot="nav"
                panel=${VIEWS.LISTADO_APIARIOS}
                id="tab-apiarios"
                class="wa-font-weight-semibold"
                ?active=${this.currentView === VIEWS.LISTADO_APIARIOS}
                @click=${() => this.navigate(ROUTES.LISTADO_APIARIOS)}
              >
                <wa-icon name="cubes-stacked" style="margin-right: var(--wa-space-xs);"></wa-icon>
                <span>Apiarios</span>
              </wa-tab>
              <wa-tab
                slot="nav"
                panel=${VIEWS.LISTADO_COLMENAS}
                id="tab-colmenas"
                class="wa-font-weight-semibold"
                ?active=${this.currentView === VIEWS.LISTADO_COLMENAS}
                @click=${() => this.navigate(ROUTES.LISTADO_COLMENAS)}
              >
                <wa-icon name="cube" style="margin-right: var(--wa-space-xs);"></wa-icon>
                <span>Colmenas</span>
              </wa-tab>
              <wa-tab
                slot="nav"
                panel=${VIEWS.LISTADO_INSPECCIONES}
                id="tab-inspecciones"
                class="wa-font-weight-semibold"
                ?active=${this.currentView === VIEWS.LISTADO_INSPECCIONES}
                @click=${() => this.navigate(ROUTES.LISTADO_INSPECCIONES)}
              >
                <wa-icon name="clipboard-check" style="margin-right: var(--wa-space-xs);"></wa-icon>
                <span>Inspecciones</span>
              </wa-tab>
            </wa-tab-group>
          </nav>
        </header>

        <main
          class="wa-stack wa-align-items-center"
          style="padding: var(--wa-space-xl) var(--wa-space-l); width: 100%; flex: 1;"
        >
          ${this.router.outlet()}
        </main>
      </wa-page>
    `;
  }

  private getViewTitle() {
    switch (this.currentView) {
      case VIEWS.LOGIN:
        return "Iniciar sesión";
      case VIEWS.APIARIO:
        return "Nuevo apiario";
      case VIEWS.COLMENA:
        return "Nueva colmena";
      case VIEWS.INSPECCION:
        return "Nueva inspección";
      case VIEWS.LISTADO_COLMENAS:
        return "Colmenas";
      case VIEWS.LISTADO_INSPECCIONES:
        return "Inspecciones de Campo";
      case VIEWS.LISTADO_APIARIOS:
      default:
        return "Apiarios";
    }
  }

  private handleLogout() {
    authService.logout();
    void this.navigate(ROUTES.LOGIN);
  }
}

if (!customElements.get("app-router")) {
  customElements.define("app-router", AppRouter);
}

declare global {
  interface HTMLElementTagNameMap {
    "app-router": AppRouter;
  }
}

/**
 * Gestor simplificado para sincronización con navegación externa.
 */
export class ViewRouter {
  public readonly appRouter: AppRouter;

  constructor(container: HTMLElement) {
    this.appRouter = document.createElement("app-router");
    container.replaceChildren(this.appRouter);
    window.addEventListener("popstate", () => this.syncFromUrl());
    window.addEventListener("hashchange", () => this.syncFromUrl());
  }

  public async navigate(view: string): Promise<void> {
    await this.appRouter.navigate(view);
  }

  public init(): void {
    this.syncFromUrl();
  }

  private syncFromUrl(): void {
    const path = window.location.pathname.toLowerCase();
    void this.navigate(path);
  }
}
