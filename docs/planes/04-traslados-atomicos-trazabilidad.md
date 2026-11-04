# Plan Detallado 04: Módulo de Traslados Atómicos y Trazabilidad Histórica

## 1. Visión General y Justificación de Impacto
El traslado de colmenas entre apiarios (por floración estacional, polinización o sanidad) es una operación central de la apicultura trashumante.
Si el cambio de ubicación no se ejecuta de forma atómica con el registro histórico de traslado, existe un alto riesgo de desincronización:
- Que se cree el registro histórico pero la colmena quede en el apiario de origen.
- O que la colmena cambie de apiario sin dejar constancia histórica de cuándo y por qué se movió.

El uso de `writeBatch` en Firestore garantiza que ambas operaciones sucedan simultáneamente en la caché local IndexedDB y en Cloud Firestore, preservando una auditoría inmutable e íntegra.

---

## 2. Diagnóstico del Estado Actual
- **Ausencia del Módulo de Traslados:** La funcionalidad figura como "POR REALIZAR" en el `README.md`.
- **Falta de Entidad y Servicio:** No existen `traslado.model.ts` ni `traslado.service.ts`.
- **Inexistencia de Operaciones Atómicas:** `FirestoreService` solo provee operaciones individuales documento a documento (`setDoc`, `updateDoc`, `deleteDoc`).
- **Falta de UI:** No hay formulario para registrar traslados ni vista para consultar la cronología de movimientos de una colmena.

---

## 3. Especificación Técnica

### 3.1. Modelo `HistorialTraslado`
Crear `src/models/traslado.model.ts`:
```typescript
export interface HistorialTraslado {
  id?: string;
  userId?: string;
  colmenaId: string;
  apiarioOrigenId: string;
  apiarioDestinoId: string;
  fecha: string;
  motivo: string;
  notas?: string;
  createdAtLocal: string;
}
```

### 3.2. Servicio `TrasladoService`
Crear `src/services/traslado.service.ts`:
- Extiende de `FirestoreService<HistorialTraslado>` apuntando a la colección `'historial_traslados'`.
- Provee método `getTrasladosPorColmena(colmenaId: string): Promise<HistorialTraslado[]>`.
- Provee método `getTrasladosPorApiario(apiarioId: string): Promise<HistorialTraslado[]>`.

### 3.3. Transacción Atómica en `ColmenaService`
Incorporar método `registrarTraslado(traslado): Promise<void>` en `src/services/colmena.service.ts`:


### 3.4. Interfaz de Usuario: Formulario de Traslado
Crear `src/views/colmena/formulario-traslado.ts`:
- **Campos del formulario:**
  - Selector de Colmena (muestra número de colmena y apiario actual).
  - Apiario de Origen (auto-completado y deshabilitado para evitar inconsistencias).
  - Selector de Apiario de Destino (filtra el apiario de origen de las opciones).
  - Fecha del traslado (por defecto fecha actual).
  - Motivo del traslado (Select/Input: *"Floración / Trashumancia"*, *"Sanidad / Aislamiento"*, *"Fusión de colmenares"*, *"Optimización de espacio"*, *"Otro"*).
  - Notas complementarias.
- **Acciones:**
  - `await this.colmenaService.trasladarColmena(...)`.
  - Feedback visual fiel (offline / online).
  - Redirección al listado o ficha de la colmena.

### 3.5. Componente de Historial en Ficha de Colmena
- En la tarjeta o vista de detalle de la colmena, incorporar una pestaña o acordeón *"Historial de Traslados"* que liste en orden cronológico inverso todos los movimientos registrados con sus fechas, orígenes, destinos y motivos.

---

## 4. Tareas de Implementación Paso a Paso

1. **Definición de Tipos y Modelos:**
   - Crear `src/models/traslado.model.ts` y exportarlo en `src/models/index.ts`.

2. **Desarrollo de Servicios:**
   - Crear `src/services/traslado.service.ts`.
   - Modificar `src/services/colmena.service.ts` agregando la lógica atómica con `writeBatch`.

3. **Construcción de Vistas:**
   - Crear componente Lit `src/views/colmena/formulario-traslado.ts`.
   - Registrar la ruta `/traslados/nuevo` y `/colmenas/:id/trasladar` en `src/views/router.ts`.
   - Agregar botón de acción "Trasladar" en las tarjetas de colmena (`colmena-card.ts`).

4. **Visualización Histórica:**
   - Crear componente `src/views/components/traslado-timeline.ts` o incorporar sección en la vista de colmena.

---

## 5. Criterios de Aceptación y Validación

- [ ] Un traslado registra con éxito el documento en `historial_traslados` y actualiza `apiarioId` en `colmenas` en una sola operación atómica.
- [ ] No es posible seleccionar el mismo apiario como origen y destino.
- [ ] Si se simula una desconexión en medio del proceso, la base de datos local IndexedDB persiste ambas mutaciones conjuntamente y las sincroniza como un único lote al volver a estar online.
- [ ] La ficha de la colmena muestra con precisión la línea de tiempo de traslados con nombres resueltos de apiarios.
