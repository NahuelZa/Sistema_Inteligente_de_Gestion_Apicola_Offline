# Plan Detallado 02: Sincronización Confiable, Manejo Asíncrono y Estado Offline

## 1. Visión General y Justificación de Impacto
En un entorno de operación rural donde la conectividad es nula o inestable, la certeza del estado del dato es crítica.
Si la interfaz de usuario no espera la resolución de las promesas de guardado (`await`) antes de limpiar formularios o emitir mensajes de éxito, se genera una falsa sensación de persistencia. Ante un fallo en IndexedDB, el usuario podría perder la información sin enterarse.

Asimismo, inicializar el indicador de última sincronización con la hora actual (`new Date()`) cuando la aplicación nunca sincronizó engaña al apicultor, haciéndole creer que sus datos locales están respaldados en la nube.
Este plan garantiza la sincronización fiel, el control asíncrono estricto y la distinción de estados de persistencia.

---

## 2. Diagnóstico del Estado Actual
- **Llamadas asíncronas sin `await`:**
  - `src/views/apiario/formulario-apiario.ts`: Invoca `this.apiarioService.create(...)` sin `await`. El bloque `try/catch` no captura rechazos asíncronos y el formulario se limpia inmediatamente.
  - `src/views/colmena/formulario-colmena.ts`: Misma omisión en el guardado de colmenas.
  - `src/views/inspeccion/formulario-inspeccion.ts`: Misma omisión en el guardado de inspecciones.
- **Falsedad en `lastSyncTime`:**
  - `src/controllers/sync-controller.ts`: Si no hay clave en `localStorage`, asigna `new Date()`, mostrando erróneamente que la PWA sincronizó hace segundos.
- **Desconexión entre escrituras pendientes y estado global:**
  - `hasPendingWrites` y `pendingCount` no reflejan dinámicamente las transacciones encoladas en IndexedDB.
- **Ambigüedad en listados vacíos:**
  - La UI muestra el mismo estado para "Nunca se cargaron datos en este dispositivo" y "El usuario no tiene apiarios".

---

## 3. Especificación Técnica

### 3.1. Control Asíncrono en Formularios
En cada formulario de alta:
1. Activar estado de carga (`this.loading = true` o deshabilitar botón de envío).
2. Ejecutar `await this.service.create(...)`.
3. Validar si el cliente está `online` o `offline` mediante `navigator.onLine` / `SyncController`:
   - **Offline:** Emitir feedback visual informativo: *"Guardado localmente en el dispositivo. Pendiente de sincronización al recuperar señal."*
   - **Online:** Emitir feedback: *"Guardado y sincronizado con éxito."*
4. Resetear el formulario únicamente tras la resolución exitosa de la promesa.
5. Capturar errores en bloque `catch` para mostrar un toast de alerta y retener los datos en el formulario para evitar la pérdida del trabajo del usuario.

### 3.2. Refactorización de `SyncController`
- Inicializar `lastSyncTime` como `Date | null = null`.
- Leer de `localStorage.getItem('beekeep_last_sync_time')`. Si es `null`, mantener `null`.
- Exponer getter `get formattedLastSync(): string` que retorne:
  - Si es `null`: `"Nunca sincronizado"`
  - Si es `Date`: Formato legible `"dd/mm/aaaa hh:mm"`
- Exponer propiedad reactiva `isFirstSyncPending: boolean`.
- Monitorear snapshots de Firestore con `includeMetadataChanges: true` para detectar `hasPendingWrites` real en los documentos del usuario.

### 3.3. Componente `SyncIndicator` y Advertencia Pre-Campo
- En `src/views/components/sync-indicator.ts`:
  - Mostrar badge `"Nunca sincronizado"` si `lastSyncTime == null`.
  - Si `lastSyncTime == null` o tiene más de X horas de antigüedad y el dispositivo tiene conexión, mostrar sugerencia/alerta:
    *⚠️ "Sincronice antes de salir al campo para asegurar que cuenta con todos sus datos offline."*
- Mostrar badge diferenciado de estado:
  - 🟢 *Sincronizado con la nube*
  - 🟡 *X cambios pendientes de sincronización*
  - 🔴 *Sin conexión - Operando en modo local*

### 3.4. Diferenciación de Vistas Vacías en `listado-view.ts`
- Evaluar si `lastSyncTime === null` y la lista de apiarios/colmenas está vacía:
  - Mostrar vista especial: *"Este dispositivo aún no ha descargado datos del servidor. Conéctese a internet y sincronice para descargar sus apiarios y colmenas."*
- Si ya sincronizó (`lastSyncTime !== null`) y la lista está vacía:
  - Mostrar: *"No tienes apiarios registrados. Crea tu primer apiario con el botón '+'."*

### 3.5. Timeout en Operaciones de Escritura (`withTimeout` decorator)
En `src/services/FirestoreService.ts` se aplica un decorator `@FirestoreService.withTimeout(3_000)` sobre los métodos `create()` y `delete()`. Este decorator envuelve cada llamada asíncrona con un `Promise.race` que compite contra un `setTimeout` de 3 segundos. Si la operación no resuelve en ese lapso, se rechaza con un mensaje claro indicando el nombre de la colección y el tiempo excedido. Esto evita que el formulario quede bloqueado indefinidamente cuando la red es lenta o inestable, permitiendo al usuario reintentar la acción.

### 3.6. Detección de Sincronización Completada (`onSynced`)
En `src/services/FirestoreService.ts` se implementa el método `onSynced(userId, callback)` que suscribe un listener a nivel de colección usando `onSnapshot` con `{ includeMetadataChanges: true }`. En cada actualización del snapshot, verifica si algún documento del usuario tiene `metadata.hasPendingWrites === true`. Cuando todos los documentos reportan que no hay escrituras pendientes y la colección no está vacía, invoca el callback. Esto permite al `FirestoreController` recargar los datos después de que operaciones offline se hayan sincronizado con el servidor, reemplazando el enfoque anterior de `window.addEventListener("online", ...)` que era impreciso y generaba fugas de memoria. El listener se desuscribe en `hostDisconnected()` para evitar fugas.

---

## 4. Tareas de Implementación Paso a Paso

1. **Corrección de Formularios de Alta:**
   - Modificar `src/views/apiario/formulario-apiario.ts` implementando `async handleSubmit()` con `await` explícito, manejo de loading y feedback diferenciado.
   - Modificar `src/views/colmena/formulario-colmena.ts` con el mismo patrón asíncrono.
   - Modificar `src/views/inspeccion/formulario-inspeccion.ts` con el mismo patrón asíncrono.

2. **Ajuste en `SyncController`:**
   - Actualizar `src/controllers/sync-controller.ts` para manejar `lastSyncTime: Date | null`.
   - Implementar método para persistir y actualizar la fecha únicamente tras una sincronización confirmada exitosa.
   - Conectar listeners de `onSnapshot` con `{ includeMetadataChanges: true }`.

3. **Mejora del Widget de Sincronización:**
   - Adaptar `src/views/components/sync-indicator.ts` para renderizar el estado "Nunca sincronizado" y la advertencia preventiva para trabajo de campo.

4. **Ajuste de Mensajes en `ListadoView`:**
   - Incorporar lógica condicional en `src/views/listado/listado-view.ts` para distinguir estado de caché vacía no inicializada vs colección sin registros.

---

## 5. Criterios de Aceptación y Validación

- [x] Si ocurre un error al persistir en IndexedDB, el formulario no se limpia y el usuario recibe un mensaje de error claro.
- [x] En modo offline, el guardado de un apiario/colmena/inspección confirma inmediatamente el almacenamiento local e indica que está pendiente de subida.
- [x] Al instalar la PWA o borrar datos de navegación, el indicador muestra `"Nunca sincronizado"` en lugar de la hora actual.
- [x] La advertencia *"Sincronizar antes de salir al campo"* aparece cuando el usuario no ha realizado un sync previo y tiene conexión disponible.
- [-] La vista de listado no confunde una base de datos local vacía previa a la sincronización inicial con una cuenta que no posee apiarios.
