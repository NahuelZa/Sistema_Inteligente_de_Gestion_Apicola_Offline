import { describe, it, expect, vi, beforeEach } from "vitest";
import { FirestoreService, authService } from "../src/services";

describe("FirestoreService - Client Side Security & Validations", () => {
  let service: FirestoreService;

  beforeEach(() => {
    service = new FirestoreService("apiarios");
    vi.restoreAllMocks();
  });

  it("debe rechazar create() si el usuario no está autenticado", async () => {
    vi.spyOn(authService, "getCurrentUserId").mockReturnValue(null);

    await expect(
      service.create({ nombre: "Apiario Sin Auth" } as any)
    ).rejects.toThrow("Operación rechazada: Usuario no autenticado.");
  });


  it("debe rechazar delete() si el usuario no está autenticado", async () => {
    vi.spyOn(authService, "getCurrentUserId").mockReturnValue(null);

    await expect(
      service.delete("doc-123")
    ).rejects.toThrow("Operación rechazada: Usuario no autenticado.");
  });

  it("debe rechazar getAll() si no hay targetUserId ni sesión activa", async () => {
    vi.spyOn(authService, "getCurrentUserId").mockReturnValue(null);

    await expect(
      service.getAll()
    ).rejects.toThrow("Operación rechazada: No se puede obtener \"apiarios\" sin usuario autenticado.");
  });
});
