import './style.css';

// Import Web Awesome components
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/animation/animation.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';


import { FirestoreService } from "./services";
import type { Colmena } from "./models/colmena.models";
import { db } from "./config/firebase";

export { db };

// Instancia del servicio para la colección "colmenas"
const colmenasService = new FirestoreService<Colmena>("colmenas");

// Elementos del DOM
const form = document.getElementById("colmenaForm")! as HTMLFormElement;
const statusCallout = document.getElementById("connectionStatus");
const statusText = document.getElementById("connectionStatusText");
const statusIcon = statusCallout?.querySelector("wa-icon");
const outputPre = document.getElementById("localOutput")!;
const submitBtn = document.getElementById("submitBtn");


const dropdown = document.getElementById("estado") as HTMLElement | null;
const triggerButton = dropdown?.querySelector('wa-button[slot="trigger"]') as HTMLElement | null;

const errorMessageDiv = document.getElementById("errorMessage") as HTMLDivElement | null;

dropdown?.addEventListener("wa-select", (event: Event) => {
  const customEvent = event as CustomEvent;
  const itemSeleccionado = customEvent.detail.item;

  if (itemSeleccionado && triggerButton) {
    triggerButton.textContent = itemSeleccionado.textContent;
  }
});

// Detectar estado de la conexión a nivel de navegador
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

function updateNetworkStatus() {
  if (navigator.onLine) {
    if (statusCallout) statusCallout.setAttribute("variant", "success");
    if (statusIcon) statusIcon.setAttribute("name", "circle-check");
    if (statusText) statusText.textContent = "Conectado a Internet";
  } else {
    if (statusCallout) statusCallout.setAttribute("variant", "danger");
    if (statusIcon) statusIcon.setAttribute("name", "triangle-exclamation");
    if (statusText) statusText.textContent = "Modo Offline (Modo Avión)";
  }
}
updateNetworkStatus();

export type EstadoColmena = "habilitada" | "inhabilitada";

// Guardar inspección (Soportado completamente Offline)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigoInput = document.getElementById("colmenaId") as HTMLInputElement | null;
  const apiarioIdInput = document.getElementById("apiarioId") as HTMLInputElement | null;
  const estadoInput = document.getElementById("estado") as HTMLSelectElement | null;

  const codigo = codigoInput?.value?.trim() || "";
  const apiarioId = apiarioIdInput?.value?.trim() || "";
  const estado = estadoInput?.value as EstadoColmena | null;

  if (!codigo || !apiarioId || !estado) {
    return;
  }

  const nuevaColmena: Colmena = {
    codigo: codigo,
    apiario_id: apiarioId,
    fecha_creacion: FirestoreService.serverTimestamp(),
    estado: estado || "habilitada"
  };

  try {
    submitBtn?.setAttribute("loading", "");
    errorMessageDiv!.textContent = ""

    // Guarda y checkea repetidos inmediatamente en IndexedDB y online a través de la abstracción (incluso sin conexión)
    try {
      const docId = await colmenasService.createWithUniqueId(nuevaColmena.codigo, nuevaColmena);
      console.log("📝 Documento escrito localmente con ID:", docId);
      form?.reset();
      // Escuchar el estado de sincronización del documento creado
      escucharEstadoSincronizacion(docId);
    } catch (error) {
      errorMessageDiv!.textContent = (error as Error).message;
    }
  } finally {
    submitBtn?.removeAttribute("loading");
  }
});

// Verificar la sincronización e idempotencia con la nube usando el servicio
function escucharEstadoSincronizacion(colmenaId: string) {
  colmenasService.listenById(colmenaId, (doc, metadata) => {
    if (!doc || !outputPre) return;

    // metadata.hasPendingWrites determina si el cambio aún vive solo en local
    const pendienteSincro = metadata.hasPendingWrites;

    outputPre.textContent = JSON.stringify(
      {
        id: doc.id,
        data: doc,
        estado: pendienteSincro
          ? "⏳ Guardado solo en Local (Pendiente subir)"
          : "☁️ Sincronizado en la Nube",
        desdeCache: metadata.fromCache
      },
      null,
      2
    );
  });
}

