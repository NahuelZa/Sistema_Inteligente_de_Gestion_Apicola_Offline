import {html, LitElement, nothing} from "lit";
import {Router} from "@lit-labs/router";
import "@awesome.me/webawesome/dist/components/page/page.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/button/button.js";

import {ROUTES, VIEWS, type ViewType} from "../constants";
import {NAVIGATE_EVENT, type NavigateDetail} from "../utils";
import {apiarioService, colmenaService, authService} from "../services";
import {FirestoreController} from "../controllers";
import "./apiario/formulario-apiario";
import "./colmena/formulario-colmena";
import "./inspeccion/formulario-inspeccion";
import "./home/home-view";
import "./listado/listado-view";
import "./login/login-view";
import "./components/sync-indicator";
import {customElement} from "lit/decorators.js";

export type {ViewType};

/**
 * Enrutador principal de la aplicación BeeKeep.
 */
@customElement("app-router")
export class AppRouter extends LitElement {
    static override properties = {
        currentView: {type: String},
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
            render: () => html`
                <login-view></login-view>`,
            enter: () => this.setView(VIEWS.LOGIN),
        },
        {
            path: ROUTES.HOME,
            render: () => html`
                <home-view></home-view>`,
            enter: () =>
                this.requireAuth(() => {
                    void this.apiariosController.loadDocuments();
                    return this.setView(VIEWS.LISTADO_APIARIOS);
                })
        },
        {
            path: ROUTES.APIARIO,
            render: () => html`
                <formulario-apiario></formulario-apiario>`,
            enter: () => this.requireAuth(() => this.setView(VIEWS.APIARIO)),
        },
        {
            path: ROUTES.COLMENA,
            render: () =>
                html`
                    <formulario-colmena
                            .apiarios=${this.apiariosController.value}
                    ></formulario-colmena>`,
            enter: () => {
                void this.apiariosController.loadDocuments();
                return this.requireAuth(() => this.setView(VIEWS.COLMENA));
            },
        },
        {
            path: ROUTES.INSPECCION,
            render: () =>
                html`
                    <formulario-inspeccion
                            .colmenas=${this.colmenasController.value}
                            .apiarios=${this.apiariosController.value}
                    ></formulario-inspeccion>`,
            enter: () => {
                void this.colmenasController.loadDocuments();
                void this.apiariosController.loadDocuments();
                return this.requireAuth(() => this.setView(VIEWS.INSPECCION));
            },
        },
        {
            path: ROUTES.NUEVA_INSPECCION,
            render: () =>
                html`
                    <formulario-inspeccion
                            .colmenas=${this.colmenasController.value}
                            .apiarios=${this.apiariosController.value}
                    ></formulario-inspeccion>`,
            enter: () => {
                void this.colmenasController.loadDocuments();
                void this.apiariosController.loadDocuments();
                return this.requireAuth(() => this.setView(VIEWS.INSPECCION));
            },
        },
        {
            path: ROUTES.LISTADO_APIARIOS,
            render: () => html`
                <home-view current-view="apiarios"></home-view>`,
            enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_APIARIOS)),
        },
        {
            path: ROUTES.LISTADO_COLMENAS,
            render: () => html`
                <home-view current-view="colmenas"></home-view>`,
            enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_COLMENAS)),
        },
        {
            path: ROUTES.LISTADO_INSPECCIONES,
            render: () => html`
                <home-view current-view="inspecciones"></home-view>`,
            enter: () => this.requireAuth(() => this.setView(VIEWS.LISTADO_INSPECCIONES)),
        },
        {
            path: ROUTES.LISTADO,
            render: () => html`
                <home-view current-view="apiarios"></home-view>`,
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
    private async requireAuth(onSuccess: () => boolean) {
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
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
                    <div class="wa-cluster wa-align-items-center wa-justify-content-between"
                         style="width: 100%; padding-top: var(--wa-space-xs);">
                        <h1
                                class="wa-cluster wa-heading-xl wa-font-weight-bold"
                                id="${this.currentView}-view-title"
                                style="margin: 0; display: flex; align-items: center; gap: var(--wa-space-xs);"
                        >
                            <span>🐝</span>
                            <span>${this.getViewTitle()}</span>
                        </h1>

                        <div id="header-sync-container"
                             style="margin-left: auto; display: flex; align-items: center; gap: var(--wa-space-s);">
                            <sync-indicator></sync-indicator>
                        </div>
                        ${this.loginButton()}

                    </div>
                </header>
                <main
                        class="wa-stack"
                        style="padding: var(--wa-space-xl) var(--wa-space-l); width: 100%; flex: 1;"
                >
                    ${this.router.outlet()}
                </main>

            </wa-page>
        `;
    }

    private loginButton() {
        return this.currentView !== VIEWS.LOGIN ? html`
            <wa-button
                    variant="neutral"
                    appearance="accent"
                    size="xs"
                    @click=${() => this.handleLogout()}
            >
                <wa-icon slot="start" name="arrow-right-from-bracket"></wa-icon>
                Cerrar sesión
            </wa-button>
        ` : nothing
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
