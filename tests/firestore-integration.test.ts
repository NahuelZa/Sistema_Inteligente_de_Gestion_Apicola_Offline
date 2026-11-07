import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COLLECTIONS } from "../src/constants";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

/**
 * Integration tests that run against the Firestore emulator.
 * Uses @firebase/rules-unit-testing to create an authenticated context
 * so the emulator security rules allow the operations.
 * All singleton services are patched to use the authenticated Firestore instance.
 * Run with: npm run test:integration
 */
describe("ApiarioService - Inactivar con colmenas activas (emulator)", () => {
  let testEnv: RulesTestEnvironment;
  let authenticatedDb: firebase.firestore.Firestore;

  const testUserId = "user-integration-test";

  beforeAll(async () => {
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
    testEnv = await initializeTestEnvironment({
      projectId: "beekeep-integration-test",
      firestore: {
        rules,
        host: "127.0.0.1",
        port: 8088,
      },
    });

    // Create an authenticated context
    authenticatedDb = testEnv.authenticatedContext(testUserId).firestore();

    // Force import all services so their singletons are registered
    const { FirestoreService, authService } = await import("../src/services");

    // Patch ALL singleton service instances to use the authenticated Firestore.
    // This ensures apiarioService.inactivar() -> colmenaService.getAllActivos()
    // both use the same authenticated emulator connection.
    for (const service of FirestoreService.getInstances()) {
      (service as any).firestore = authenticatedDb;
    }

    // Mock auth to return the test user ID
    vi.spyOn(authService, "getCurrentUserId").mockReturnValue(testUserId);
  });

  beforeEach(async () => {
    // Clean up emulator data before each test
    for (const colName of [COLLECTIONS.APIARIOS, COLLECTIONS.COLMENAS]) {
      const q = query(collection(authenticatedDb, colName), where("userId", "==", testUserId));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(authenticatedDb, colName, d.id));
      }
    }
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it("no debe permitir archivar un apiario si aún tiene colmenas activas", async () => {
    const { apiarioService, colmenaService } = await import("../src/services");
    // Create real data in the emulator
    const apiarioId = await apiarioService.create({
      nombre: "Apiario Test",
      ubicacion: "-31.4,-64.1",
      notas: "",
      estado: "activo",
    } as any);

    await colmenaService.create({
      apiarioId,
      numeroColmena: "C-001",
      fechaAlta: "2024-01-01",
      estado: "activo",
    } as any);

    // The service now talks to the emulator — no mocks for Firestore
    await expect(
      apiarioService.inactivar(apiarioId)
    ).rejects.toThrow("No se puede archivar el apiario mientras tenga colmenas activas.");
  });

  it("debe permitir archivar un apiario si no tiene colmenas activas", async () => {
    const { apiarioService } = await import("../src/services");
    // Create an apiario with no colmenas
    const apiarioId = await apiarioService.create({
      nombre: "Apiario Vacío",
      ubicacion: "-31.5,-64.2",
      notas: "",
      estado: "activo",
    } as any);

    // Should succeed — no active colmenas
    await expect(
      apiarioService.inactivar(apiarioId)
    ).resolves.toBeUndefined();
  });

  it("no debe permitir archivar un apiario si tiene al menos una colmena activa entre varias", async () => {
    const { apiarioService, colmenaService } = await import("../src/services");
    // Create two apiarios
    const apiario1Id = await apiarioService.create({
      nombre: "Apiario Uno",
      ubicacion: "-31.4,-64.1",
      notas: "",
      estado: "activo",
    } as any);

    const apiario2Id = await apiarioService.create({
      nombre: "Apiario Dos",
      ubicacion: "-31.5,-64.2",
      notas: "",
      estado: "activo",
    } as any);

    // Colmena in apiario 2 (should not block apiario 1)
    await colmenaService.create({
      apiarioId: apiario2Id,
      numeroColmena: "C-001",
      fechaAlta: "2024-01-01",
      estado: "activo",
    } as any);

    // Colmena in apiario 1 (should block apiario 1)
    await colmenaService.create({
      apiarioId: apiario1Id,
      numeroColmena: "C-002",
      fechaAlta: "2024-02-01",
      estado: "activo",
    } as any);

    // Archiving apiario 1 should fail because it has an active colmena
    await expect(
      apiarioService.inactivar(apiario1Id)
    ).rejects.toThrow("No se puede archivar el apiario mientras tenga colmenas activas.");

    // Archiving apiario 2 should also fail — it also has an active colmena
    await expect(
      apiarioService.inactivar(apiario2Id)
    ).rejects.toThrow("No se puede archivar el apiario mientras tenga colmenas activas.");
  });

  it("debe permitir archivar un apiario después de inactivar sus colmenas", async () => {
    const { apiarioService, colmenaService } = await import("../src/services");
    const apiarioId = await apiarioService.create({
      nombre: "Apiario Con Colmena Inactiva",
      ubicacion: "-31.6,-64.3",
      notas: "",
      estado: "activo",
    } as any);

    const colmenaId = await colmenaService.create({
      apiarioId,
      numeroColmena: "C-003",
      fechaAlta: "2024-03-01",
      estado: "activo",
    } as any);

    // First, inactivate the colmena
    await colmenaService.inactivar(colmenaId);

    // Now the apiario should be archivable since the colmena is no longer active
    await expect(
      apiarioService.inactivar(apiarioId)
    ).resolves.toBeUndefined();
  });
});
