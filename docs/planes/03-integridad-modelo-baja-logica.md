# Plan Detallado 03: Integridad del Modelo, Baja Lógica y Política de Conflictos

## 1. Visión General y Justificación de Impacto
La destrucción física de datos (`deleteDoc`) en un sistema apícola vulnera la trazabilidad histórica y el principio *append-only* indispensable para auditorías sanitarias y productivas.
Si un usuario elimina una inspección porque cometió un error tipográfico, se pierde la constancia de que la colmena fue visitada. Si se elimina un apiario o una colmena físicamente, se generan registros huérfanos en colecciones relacionadas (inspecciones y traslados sin entidad padre).

Por otro lado, almacenar `apiarioNombre` dentro del documento de la colmena genera desincronización si el apiario es renombrado.
Este plan normaliza el modelo relacional en Firestore, implementa el borrado lógico (*soft-delete*) y formaliza las reglas de resolución de conflictos para la versión P0.

---

## 2. Diagnóstico del Estado Actual
- **Borrado Físico Destructivo en UI:**
  - `src/views/listado/listado-view.ts`: Ejecuta `this.inspeccionService.delete(id)`, `this.colmenaService.delete(id)` y `this.apiarioService.delete(id)` borrando documentos irreversiblamente de Cloud Firestore e IndexedDB.
- **Redundancia y Desincronización en `Colmena`:**
  - `src/models/colmena.model.ts`: Posee `apiarioNombre: string` junto a `apiarioId: string`. Si el apiario cambia de denominación, las colmenas mantienen el nombre viejo.
  - `src/views/colmena/formulario-colmena.ts`: Guarda manualmente el nombre seleccionado del apiario.
- **Ambigüedad Sanitaria:**
  - `src/views/inspeccion/formulario-inspeccion.ts`: Si el campo de enfermedades queda vacío, asigna `"No ingresado"`. No se distingue si el apicultor revisó y no encontró patologías o si no realizó la evaluación.
- **Documentación de Concurrencia Incompleta:**
  - No está explicitado el supuesto de operación con un dispositivo principal por apicultor.

---

## 3. Especificación Técnica

### 3.1. Formalización de la Política de Conflictos (P0)
- En `README.md`, documentar la decisión de arquitectura:
  - **Alcance P0:** Cada apicultor opera con un único dispositivo móvil principal durante su jornada en campo.
  - **Estrategia:** *Last-Write-Wins* (LWW) gestionado a nivel de documento por Cloud Firestore en base al timestamp del servidor cuando hay reconexión.
  - **Mitigación:** IDs generados mediante UUID v4 / Firestore Auto-ID antes de guardar para evitar colisiones de clave primaria.

### 3.2. Normalización del Modelo `Colmena`
- Modificar `src/models/colmena.model.ts`:
  ```typescript
  export interface Colmena {
    id?: string;
    userId?: string;
    apiarioId: string;
    // Removido: apiarioNombre?: string;
    numeroColmena: string;
    fechaAlta: string;
    estado: 'activa' | 'inactiva';
    notas?: string;
    createdAtLocal?: string;
    updatedAtLocal?: string;
  }
  ```
- En vistas y tarjetas (`colmena-card.ts`, `listado-view.ts`), resolver el nombre del apiario mediante un `Map<string, Apiario>` o búsqueda en la lista cargada de apiarios:
  ```typescript
  getNombreApiario(apiarioId: string): string {
    const apiario = this.apiarios.find(a => a.id === apiarioId);
    return apiario ? apiario.nombre : 'Apiario no encontrado';
  }
  ```

### 3.3. Modelo de Inspección e Inmutabilidad (*Soft-Delete*)
- Modificar `src/models/inspeccion.model.ts`:
  ```typescript
  export interface Inspeccion {
    id?: string;
    userId?: string;
    colmenaId: string;
    apiarioId: string;
    fecha: string;
    poblacion: string;
    reinaVista: boolean;
    tienePostura: boolean;
    estadoSanitario: string;
    enfermedadesDetectadas: string; // "Ninguna" | "Varroa" | "Loque" | "No evaluado"
    notasTexto?: string;
    anulada?: boolean;
    motivoAnulacion?: string;
    anuladaAt?: string;
    createdAtLocal?: string;
  }
  ```
- En `src/services/inspeccion.service.ts`:
  - Implementar `anularInspeccion(id: string, motivo: string): Promise<void>`.
  - Desaconsejar/deprecar el método `delete()` físico.

### 3.4. Bajas Lógicas en `Apiario` y `Colmena`
- Modificar `Apiario`:
  ```typescript
  export interface Apiario {
    id?: string;
    userId?: string;
    nombre: string;
    ubicacion?: string;
    notas?: string;
    estado: 'activo' | 'inactivo';
    createdAtLocal?: string;
  }
  ```
- En `src/views/listado/listado-view.ts`:
  - Reemplazar botones de "Eliminar" destructivos:
    - Para Inspección: Modal o prompt de "Anular inspección" con solicitud de motivo.
    - Para Apiario/Colmena: Acción "Dar de baja" / "Inactivar".
  - En los filtros de listado, permitir visualizar registros activos por defecto, con switch opcional "Mostrar inactivos / anulados".

### 3.5. Corrección Semántica de Enfermedades
- En `src/views/inspeccion/formulario-inspeccion.ts`:
  - Si el selector/input de enfermedades no contiene selección: Guardar `"Ninguna detectada"`.
  - Si el usuario explícitamente selecciona que no evaluó el cuadro: Guardar `"No evaluado"`.

---

## 4. Tareas de Implementación Paso a Paso

1. **Refactorización de Interfaces TypeScript:**
   - Actualizar `src/models/colmena.model.ts`, `src/models/inspeccion.model.ts` y `src/models/apiario.model.ts`.

2. **Actualización de Servicios de Dominio:**
   - Agregar método `anular(id, motivo)` en `InspeccionService`.
   - Agregar método `inactivar(id)` en `ColmenaService` y `ApiarioService`.

3. **Modificación de Formularios y Componentes:**
   - Eliminar `apiarioNombre` de `formulario-colmena.ts`.
   - Ajustar lógica de asignación semántica de enfermedades en `formulario-inspeccion.ts`.
   - Modificar `colmena-card.ts` y `inspeccion-card.ts` para renderizar badges de "Inactiva" / "Anulada" y resolver nombres por ID.

4. **Modificación de la Vista de Listado:**
   - Actualizar manejadores de eventos en `listado-view.ts` para ejecutar anulaciones e inactivaciones lógicas.

5. **Documentación:**
   - Actualizar `README.md` con la política formal de concurrencia y el DER normalizado.

---

## 5. Criterios de Aceptación y Validación

- [ ] Las colmenas se crean y persisten sin el campo redundante `apiarioNombre`.
- [ ] Renombrar un apiario refleja inmediatamente el nuevo nombre en todas las tarjetas de sus colmenas asociadas.
- [ ] Al presionar anular en una inspección, el documento no se borra de Firestore; se actualiza con `anulada: true` y muestra un badge distintivo "Anulada".
- [ ] Al dar de baja una colmena o apiario, pasa a estado `inactiva` / `inactivo` preservando todas las inspecciones históricas.
- [ ] El campo de enfermedades guarda `"Ninguna detectada"` cuando no se especifican patologías.
