
import {html, LitElement} from "lit";
import "@awesome.me/webawesome/dist/components/page/page.js";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import {ROUTES, VIEWS, type ViewType} from "../constants";
import {NAVIGATE_EVENT, type NavigateDetail} from "../utils";
import {apiarioService} from "../services";
import {FirestoreController} from "../controllers";
import "./apiario/apiario-view";
import "./colmena/colmena-view";
import "./listado/listado-view";

export type { ViewType };

/**
 * Enrutador principal de la aplicación.
 */
export class AppRouter extends LitElement {
  static override properties = {
    currentView: { type: String },
  };

  private currentView: ViewType;
  private apiariosController = new FirestoreController(this, apiarioService);

  constructor() {
    super();
    this.currentView = VIEWS.LISTADO_APIARIOS;
  }

  private router = new Router(this, [
    {
      path: ROUTES.HOME,
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.setView(VIEWS.LISTADO_APIARIOS),
    },
    {
      path: ROUTES.APIARIO,
      render: () => html`<apiario-view></apiario-view>`,
      enter: () => this.setView(VIEWS.APIARIO),
    },
    {
      path: ROUTES.COLMENA,
      render: () => html`<colmena-view .apiarios=${this.apiariosController.value}></colmena-view>`,
      enter: () => {
        void this.apiariosController.load();
        return this.setView(VIEWS.COLMENA);
      },
    },
    {
      path: ROUTES.LISTADO_APIARIOS,
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.setView(VIEWS.LISTADO_APIARIOS),
    },
    {
      path: ROUTES.LISTADO_COLMENAS,
      render: () => html`<listado-view type="colmenas"></listado-view>`,
      enter: () => this.setView(VIEWS.LISTADO_COLMENAS),
    },
    {
      path: ROUTES.LISTADO,
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.setView(VIEWS.LISTADO_APIARIOS),
    },
    {
      path: "/listado-apiarios",
      render: () => html`<listado-view type="apiarios"></listado-view>`,
      enter: () => this.setView(VIEWS.LISTADO_APIARIOS),
    },
    {
      path: "/listado-colmenas",
      render: () => html`<listado-view type="colmenas"></listado-view>`,
      enter: () => this.setView(VIEWS.LISTADO_COLMENAS),
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
        <header
          slot="header"
          class="wa-stack wa-gap- view-header"
        >
          <h1
            class="wa-heading-xl wa-font-weight-bold"
            id="${this.currentView}-view-title"
            style="margin: 0;"
          >
            ${this.getViewTitle()}
          </h1>

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
      case VIEWS.APIARIO:
        return "Nuevo apiario";
      case VIEWS.COLMENA:
        return "Nueva colmena";
      case VIEWS.LISTADO_COLMENAS:
        return "Colmenas";
      case VIEWS.LISTADO_APIARIOS:
      default:
        return "Apiarios";
    }
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
