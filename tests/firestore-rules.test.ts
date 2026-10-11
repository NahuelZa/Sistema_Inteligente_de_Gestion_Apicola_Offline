import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

describe("Cloud Firestore Security Rules & Multi-Tenant Isolation", () => {
  let testEnv: RulesTestEnvironment;
  const PROJECT_ID = "beekeep-security-test";
  const USER_A = "usuario_a";
  const USER_B = "usuario_b";

  beforeAll(async () => {
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: process.env.FIRESTORE_EMULATOR_HOST?.split(":")[0] || "127.0.0.1",
        port: parseInt(process.env.FIRESTORE_EMULATOR_HOST?.split(":")[1] || "8088", 10),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe("1. Acceso No Autenticado", () => {
    it("debe rechazar lectura y escritura a usuarios no autenticados en todas las colecciones", async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();

      // apiarios
      await assertFails(getDoc(doc(unauthDb, "apiarios", "apiario-1")));
      await assertFails(setDoc(doc(unauthDb, "apiarios", "apiario-1"), { userId: "anon", nombre: "Apiario 1" }));

      // colmenas
      await assertFails(getDoc(doc(unauthDb, "colmenas", "colmena-1")));
      await assertFails(setDoc(doc(unauthDb, "colmenas", "colmena-1"), { userId: "anon", numeroColmena: "C1" }));

      // inspecciones
      await assertFails(getDoc(doc(unauthDb, "inspecciones", "inspeccion-1")));
      await assertFails(setDoc(doc(unauthDb, "inspecciones", "inspeccion-1"), { userId: "anon", poblacion: "alta" }));

      // historial_traslados
      await assertFails(getDoc(doc(unauthDb, "historial_traslados", "traslado-1")));
      await assertFails(setDoc(doc(unauthDb, "historial_traslados", "traslado-1"), { userId: "anon", motivo: "Trashumancia" }));

      // Rutas no especificadas
      await assertFails(getDoc(doc(unauthDb, "usuarios", "user-1")));
      await assertFails(setDoc(doc(unauthDb, "otra_coleccion", "item-1"), { foo: "bar" }));
    });
  });

  describe("2. Operaciones Propias del Usuario (Usuario A)", () => {
    it("debe permitir crear, leer, actualizar y eliminar sus propios apiarios", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();
      const apiarioRef = doc(dbA, "apiarios", "apiario-a1");

      // Create
      await assertSucceeds(setDoc(apiarioRef, { userId: USER_A, nombre: "Valle Hermoso", ubicacion: "-31.4,-64.1" }));

      // Read
      await assertSucceeds(getDoc(apiarioRef));

      // Update
      await assertSucceeds(updateDoc(apiarioRef, { userId: USER_A, nombre: "Valle Hermoso Modificado" }));

      // Delete
      await assertSucceeds(deleteDoc(apiarioRef));
    });

    it("debe permitir crear, leer, actualizar y eliminar sus propias colmenas", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();
      const colmenaRef = doc(dbA, "colmenas", "colmena-a1");

      await assertSucceeds(setDoc(colmenaRef, { userId: USER_A, apiarioId: "apiario-a1", numeroColmena: "COL-001" }));
      await assertSucceeds(getDoc(colmenaRef));
      await assertSucceeds(updateDoc(colmenaRef, { userId: USER_A, estado: "fuerte" }));
      await assertSucceeds(deleteDoc(colmenaRef));
    });

    it("debe permitir crear, leer, actualizar y eliminar sus propias inspecciones", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();
      const inspeccionRef = doc(dbA, "inspecciones", "inspeccion-a1");

      await assertSucceeds(setDoc(inspeccionRef, { userId: USER_A, colmenaId: "colmena-a1", poblacion: "óptima", reinaVista: true }));
      await assertSucceeds(getDoc(inspeccionRef));
      await assertSucceeds(updateDoc(inspeccionRef, { userId: USER_A, reinaVista: false }));
      await assertSucceeds(deleteDoc(inspeccionRef));
    });
  });

  describe("3. Aislamiento Multi-Tenant (Usuario A vs Usuario B)", () => {
    beforeEach(async () => {
      // Poblar datos de Usuario B usando contexto administrativo (withSecurityRulesDisabled)
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        const adminDb = adminContext.firestore();
        await setDoc(doc(adminDb, "apiarios", "apiario-b1"), {
          userId: USER_B,
          nombre: "Apiario de B",
          ubicacion: "-34.6,-58.4",
        });
        await setDoc(doc(adminDb, "colmenas", "colmena-b1"), {
          userId: USER_B,
          apiarioId: "apiario-b1",
          numeroColmena: "COL-B1",
        });
        await setDoc(doc(adminDb, "inspecciones", "inspeccion-b1"), {
          userId: USER_B,
          colmenaId: "colmena-b1",
          poblacion: "media",
        });
        await setDoc(doc(adminDb, "historial_traslados", "traslado-b1"), {
          userId: USER_B,
          colmenaId: "colmena-b1",
          motivo: "Floración",
        });
      });
    });

    it("el Usuario A no puede leer documentos creados por el Usuario B", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();

      await assertFails(getDoc(doc(dbA, "apiarios", "apiario-b1")));
      await assertFails(getDoc(doc(dbA, "colmenas", "colmena-b1")));
      await assertFails(getDoc(doc(dbA, "inspecciones", "inspeccion-b1")));
      await assertFails(getDoc(doc(dbA, "historial_traslados", "traslado-b1")));
    });

    it("el Usuario A no puede crear un documento asignándole el userId del Usuario B", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();

      await assertFails(setDoc(doc(dbA, "apiarios", "apiario-suplantado"), {
        userId: USER_B,
        nombre: "Apiario Falso",
      }));
      await assertFails(setDoc(doc(dbA, "colmenas", "colmena-suplantada"), {
        userId: USER_B,
        numeroColmena: "C-FAKE",
      }));
      await assertFails(setDoc(doc(dbA, "inspecciones", "inspeccion-suplantada"), {
        userId: USER_B,
        poblacion: "baja",
      }));
      await assertFails(setDoc(doc(dbA, "historial_traslados", "traslado-suplantado"), {
        userId: USER_B,
        motivo: "Ilegítimo",
      }));
    });

    it("el Usuario A no puede mutar ni borrar documentos pertenecientes al Usuario B", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();

      // Updates intentados por A en docs de B
      await assertFails(updateDoc(doc(dbA, "apiarios", "apiario-b1"), { nombre: "Hackeado por A" }));
      await assertFails(updateDoc(doc(dbA, "colmenas", "colmena-b1"), { estado: "muerta" }));
      await assertFails(updateDoc(doc(dbA, "inspecciones", "inspeccion-b1"), { poblacion: "nula" }));

      // Deletes intentados por A en docs de B
      await assertFails(deleteDoc(doc(dbA, "apiarios", "apiario-b1")));
      await assertFails(deleteDoc(doc(dbA, "colmenas", "colmena-b1")));
      await assertFails(deleteDoc(doc(dbA, "inspecciones", "inspeccion-b1")));
    });

    it("el Usuario A no puede cambiar la titularidad (userId) de su propio documento hacia otro usuario", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();
      const apiarioRef = doc(dbA, "apiarios", "apiario-a-propio");
      await assertSucceeds(setDoc(apiarioRef, { userId: USER_A, nombre: "Apiario Propio" }));

      // Intentar cambiar userId a USER_B
      await assertFails(updateDoc(apiarioRef, { userId: USER_B, nombre: "Transferido Ilegal" }));
    });
  });

  describe("4. Inmutabilidad de historial_traslados (Append-Only)", () => {
    it("permite a un usuario autenticado registrar y consultar traslados propios", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();
      const trasladoRef = doc(dbA, "historial_traslados", "traslado-a1");

      // Create propio
      await assertSucceeds(setDoc(trasladoRef, {
        userId: USER_A,
        colmenaId: "colmena-a1",
        apiarioOrigenId: "apiario-1",
        apiarioDestinoId: "apiario-2",
        fecha: "2026-10-11",
        motivo: "Cambio de temporada"
      }));

      // Read propio
      await assertSucceeds(getDoc(trasladoRef));
    });

    it("rechaza cualquier intento de update o delete en historial_traslados, incluso por el propietario", async () => {
      const dbA = testEnv.authenticatedContext(USER_A).firestore();
      const trasladoRef = doc(dbA, "historial_traslados", "traslado-a2");

      await assertSucceeds(setDoc(trasladoRef, {
        userId: USER_A,
        colmenaId: "colmena-a1",
        motivo: "Original"
      }));

      // Update debe fallar
      await assertFails(updateDoc(trasladoRef, { motivo: "Modificado" }));

      // Delete debe fallar
      await assertFails(deleteDoc(trasladoRef));
    });
  });
});
