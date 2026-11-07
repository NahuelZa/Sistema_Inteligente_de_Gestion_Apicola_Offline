import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { auth } from "../config/firebase";
import { type AuthProvider } from "./auth.interface";

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
}

/**
 * Convierte un usuario de Firebase en un UserProfile local.
 */
function toUserProfile(firebaseUser: FirebaseUser): UserProfile {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "Usuario"
  };
}

/**
 * Servicio de Autenticación y Contexto de Usuario para BeeKeep.
 * Utiliza Firebase Authentication para identificar al apicultor actual
 * y garantizar el aislamiento de datos.
 */
export class AuthService implements AuthProvider {
  private currentUser: UserProfile | null = null;
  private userChecked: ((value: boolean | PromiseLike<boolean>) => void) | null = null;

  constructor() {
    this.listenForAuthChanges();
  }

  /**
   * Inicia sesión con email y contraseña.
   */
  public async login(credentials: UserCredentials): Promise<UserProfile> {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const profile = toUserProfile(userCredential.user);
    this.currentUser = profile;
    return profile;
  }

  /**
   * Registra un nuevo usuario con email y contraseña.
   */
  public async register(credentials: UserCredentials): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    const profile = toUserProfile(userCredential.user);
    this.currentUser = profile;
    return profile;
  }

  /**
   * Cierra la sesión del usuario actual.
   */
  public async logout(): Promise<void> {
    await signOut(auth);
    this.currentUser = null;
  }

  /**
   * Retorna el ID del usuario actual o null si no hay sesión.
   */
  public getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Retorna el perfil completo del usuario actual o null si no hay sesión.
   */
  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Indica si hay un usuario autenticado.
   */
  public isAuthenticated(): Promise<boolean> {
    if (this.currentUser) {
      return Promise.resolve(true);
    }

    const {promise, resolve} = Promise.withResolvers<boolean>();
    this.userChecked = resolve;
    return promise;
  }

  /**
   * Escucha los cambios de autenticación de Firebase.
   */
  private listenForAuthChanges(): void {
    onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        this.currentUser = toUserProfile(firebaseUser);
        this.userChecked?.(true);
      } else {
        this.userChecked?.(false);
        this.currentUser = null;
      }
    });
  }


}

export const authService = new AuthService();
