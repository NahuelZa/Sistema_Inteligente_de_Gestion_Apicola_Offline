# Plan Detallado 01: Seguridad Firestore, Reglas en Servidor y Aislamiento

## 1. Visión General y Justificación de Impacto
El objetivo primordial de este cambio es eliminar el riesgo crítico de fuga o manipulación no autorizada de datos de apicultores en Cloud Firestore. 
Un filtrado del lado del cliente (`where("userId", "==", userId)`) no constituye una barrera de seguridad real si un actor malintencionado modifica el cliente o emite peticiones directas a la API de Firestore.

La implementación de reglas de seguridad en el servidor (`firestore.rules`) y el control estricto de identidad en la capa de servicios garantizan que cada apicultor acceda exclusivamente a su propia información, preservando la confidencialidad de la ubicación de los apiarios y el estado productivo/sanitario de sus colmenas.

---

## 2. Diagnóstico del Estado Actual
- **Falta de `firestore.rules`:** No existen reglas versionadas en el repositorio. Firestore opera con reglas por defecto o en modo prueba.
- **Vulnerabilidad en `create()`:** `FirestoreService.create(data)` permite que el objeto `data` entrante contenga un `userId` arbitrario.
- **Vulnerabilidad en `delete()` y `update()`:** Solo se verifica el `docId`, permitiendo teóricamente modificar o eliminar registros ajenos si se conocen o adivinan sus IDs.
- **Inconsistencia documental:** El `README.md` asevera "aislamiento completo", lo cual debe reflejar la protección real en servidor validada con pruebas.

---

## 3. Especificación Técnica

### 3.1. Archivo de Reglas: `firestore.rules`
Se versionará en la raíz del proyecto con las siguientes directivas:
1. **Función de autenticación básica:** `isAuthenticated()` verifica `request.auth != null`.
2. **Función de pertenencia:** `isOwner(userId)` verifica `isAuthenticated() && request.auth.uid == userId`.
3. **Colecciones afectadas:**
   - `/apiarios/{apiarioId}`:
     - `read`: Si `resource.data.userId == request.auth.uid`.
     - `create`: Si `isAuthenticated() && request.resource.data.userId == request.auth.uid`.
     - `update`, `delete`: Si `resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid`.
   - `/colmenas/{colmenaId}`:
     - Mismas reglas de pertenencia por `userId`.
   - `/inspecciones/{inspeccionId}`:
     - Mismas reglas de pertenencia por `userId`. `delete` deshabilitado o restringido en favor de la baja lógica.
   - `/historial_traslados/{trasladoId}`:
     - `read`: Si `resource.data.userId == request.auth.uid`.
     - `create`: Si `isAuthenticated() && request.resource.data.userId == request.auth.uid`.
     - `update`, `delete`: `false` (colección inmutable *append-only*).

### 3.2. Refactorización en `src/services/FirestoreService.ts`
- Modificar el método `create(item: Omit<T, 'id'> | T)` para inyectar obligatoriamente `authService.getCurrentUserId()`. Si el usuario no está autenticado, la promesa debe ser rechazada inmediatamente antes de interactuar con la base de datos local o remota.
- Sobrescribir cualquier valor de `userId` que venga en el objeto `data` con el UID autenticado confirmado.
- En métodos de actualización (`update`, `patch`) y baja lógica, validar precondición de sesión activa.

### 3.3. Suite de Pruebas Unitarias de Seguridad
- Instalar y configurar `@firebase/rules-unit-testing`.
- Configurar entorno de emulación (`firebase emulators:exec` o runner Vitest).
- Implementar casos de prueba en `tests/firestore-rules.test.ts`.

---

## 4. Tareas de Implementación Paso a Paso

1. **Creación de Reglas de Seguridad:**
   - Crear el archivo `firestore.rules` en el directorio raíz.
   - Definir funciones auxiliares y reglas específicas para `apiarios`, `colmenas`, `inspecciones` y `historial_traslados`.
   - Bloquear acceso a cualquier ruta no explícita (`match /{document=**} { allow read, write: if false; }`).

2. **Fortalecimiento de la Capa de Servicios (`FirestoreService.ts`):**
   - Importar `authService` en `FirestoreService.ts`.
   - En `create()`, forzar:
     ```typescript
     const currentUserId = authService.getCurrentUserId();
     if (!currentUserId) throw new Error("Operación rechazada: Usuario no autenticado.");
     const docData = { ...item, userId: currentUserId };
     ```
   - Asegurar que `update()` y `getById()` apliquen validaciones consistentes.

3. **Configuración de Testing Automatizado:**
   - Agregar dependencias de desarrollo en `package.json`: `@firebase/rules-unit-testing`.
   - Crear script `test:rules` en `package.json`.
   - Escribir suite de pruebas de reglas en `tests/firestore-rules.test.ts`.

4. **Actualización de Documentación:**
   - Actualizar sección de seguridad en `README.md` detallando las reglas implementadas y la verificación en servidor.

---

## 5. Criterios de Aceptación y Validación

- [x] Un usuario no autenticado no puede leer ni escribir en ninguna colección (falla con `PERMISSION_DENIED`).
- [x] El Usuario A puede leer, crear y editar sus propios apiarios, colmenas e inspecciones.
- [x] El Usuario A no puede leer documentos creados por el Usuario B.
- [x] El Usuario A no puede crear un documento con `userId: "usuarioB"` (las reglas de Firestore rechazan la petición).
- [x] El Usuario A no puede mutar ni borrar documentos pertenecientes al Usuario B.
- [x] La colección `historial_traslados` rechaza cualquier operación de `update` o `delete`, garantizando inmutabilidad.
