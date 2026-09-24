export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
}

const STORAGE_KEY = "beekeep_current_user";
const DEFAULT_USER: UserProfile = {
  uid: "apicultor-demo-01",
  email: "apicultor@beekeep.local",
  displayName: "Apicultor Principal"
};

/**
 * Servicio de Autenticación y Contexto de Usuario para BeeKeep.
 * Permite identificar al apicultor actual y garantizar el aislamiento de datos (multi-tenancy)
 * con persistencia garantizada en modo Offline-First.
 */
export class AuthService {
  private currentUser: UserProfile;

  constructor() {
    this.currentUser = this.loadStoredUser();
  }

  private loadStoredUser(): UserProfile {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserProfile;
    }
    this.saveStoredUser(DEFAULT_USER);
    return DEFAULT_USER;
  }

  private saveStoredUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  public getCurrentUserId(): string {
    return this.currentUser.uid;
  }

}

export const authService = new AuthService();
