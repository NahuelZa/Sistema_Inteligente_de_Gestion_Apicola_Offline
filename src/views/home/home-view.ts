import {LitElement, html} from "lit";
import {customElement, property} from "lit/decorators.js";
import {VIEWS, type ViewType} from "../../constants";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "../listado/listado-view";

/**
 * Vista principal de la aplicación BeeKeep.
 * Muestra un grupo de pestañas para navegar entre los listados de Apiarios, Colmenas e Inspecciones.
 */
@customElement("home-view")
export class HomeView extends LitElement {

    @property({type: String, attribute: "current-view"})
    private currentView: ViewType = VIEWS.LISTADO_APIARIOS;

    override createRenderRoot() {
        return this;
    }

    private handleTabShow(e: CustomEvent<{ name: string }>) {
        this.currentView = e.detail.name as ViewType;
    }

    override render() {
        return html`
            <wa-tab-group 
                id="view-switcher"
                active=${this.currentView}
                @wa-tab-show=${this.handleTabShow}
            >

                <wa-tab
                        slot="nav"
                        panel=${VIEWS.LISTADO_APIARIOS}
                        id="tab-apiarios"
                        class="wa-font-weight-semibold"
                >
                    <wa-icon name="cubes-stacked" style="margin-right: var(--wa-space-xs);"></wa-icon>
                    <span>Apiarios</span>
                </wa-tab>
                <wa-tab
                        slot="nav"
                        panel=${VIEWS.LISTADO_COLMENAS}
                        id="tab-colmenas"
                        class="wa-font-weight-semibold"
                >
                    <wa-icon name="cube" style="margin-right: var(--wa-space-xs);"></wa-icon>
                    <span>Colmenas</span>
                </wa-tab>
                <wa-tab
                        slot="nav"
                        panel=${VIEWS.LISTADO_INSPECCIONES}
                        id="tab-inspecciones"
                        class="wa-font-weight-semibold"
                >
                    <wa-icon name="clipboard-check" style="margin-right: var(--wa-space-xs);"></wa-icon>
                    <span>Inspecciones</span>
                </wa-tab>
                <wa-tab-panel
                        name=${VIEWS.LISTADO_APIARIOS}>
                    <listado-view type=${VIEWS.LISTADO_APIARIOS}></listado-view>
                </wa-tab-panel>
                <wa-tab-panel
                        name=${VIEWS.LISTADO_COLMENAS}
                >
                    <listado-view type=${VIEWS.LISTADO_COLMENAS}></listado-view>
                </wa-tab-panel>
                <wa-tab-panel
                        name=${VIEWS.LISTADO_INSPECCIONES}
                >
                    <listado-view type=${VIEWS.LISTADO_INSPECCIONES}></listado-view>
                </wa-tab-panel>
            </wa-tab-group>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "home-view": HomeView;
    }
}
