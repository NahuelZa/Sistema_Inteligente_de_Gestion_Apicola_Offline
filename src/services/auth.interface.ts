/**
 * Abstracción del proveedor de autenticación.
 * Permite que FirestoreService dependa de una interfaz en lugar de una implementación concreta,
 * facilitando las pruebas y el cumplimiento del principio DIP.
 */
export interface AuthProvider {
  getCurrentUserId(): string | null;
  isAuthenticated(): Promise<boolean>;
}
