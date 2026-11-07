import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
  type WithFieldValue
} from "firebase/firestore";
import { db as defaultDb } from "../config/firebase";
import { authService } from "./auth.service";
import { type AuthProvider } from "./auth.interface";
import { ModeloBase } from "../models";

export type DocumentWithId<T> = T & { id: string, estaSincronizado?: boolean };

/**
 * Clase genérica para abstraer y encapsular el acceso y operaciones con colecciones de Cloud Firestore.
 * Proporciona métodos CRUD, persistencia offline transparente y filtrado por usuario autenticado.
 * 
 * Los servicios concretos deben sobreescribir `createModel()` para retornar instancias de clases modelo
 * en lugar de objetos planos, aprovechando el método `esActivo()` de ModeloBase.
 */
export class FirestoreService<T extends DocumentData = DocumentData> {
  private static instances: Set<FirestoreService<any>> = new Set();
  protected readonly firestore: Firestore;
  protected readonly collectionName: string;
  private readonly auth: AuthProvider;

  /**
   * Crea una instancia de la clase modelo a partir de los datos crudos de Firestore.
   * Los servicios concretos deben sobreescribir este método para retornar su clase modelo específica.
   * @param raw Datos crudos del documento con su ID.
   * @returns Instancia de la clase modelo correspondiente.
   */
  protected createModel(raw: T & { id: string }): ModeloBase {
    return raw as unknown as ModeloBase;
  }

  constructor(collectionName: string, options: { firestore?: Firestore; auth?: AuthProvider } = {}) {
    if (!collectionName || collectionName.trim() === "") {
      throw new Error("El nombre de la colección no puede estar vacío.");
    }
    this.collectionName = collectionName;
    this.firestore = options.firestore ?? defaultDb;
    this.auth = options.auth ?? authService;
    FirestoreService.instances.add(this);
  }

  /**
   * Retorna todas las instancias registradas de FirestoreService.
   */
  public static getInstances(): FirestoreService<any>[] {
    return Array.from(FirestoreService.instances);
  }

  /**
   * Obtiene la instancia de Firestore inyectada.
   */
  public getFirestore(): Firestore {
    return this.firestore;
  }

  /**
   * Obtiene el proveedor de autenticación inyectado.
   */
  public getAuthProvider(): AuthProvider {
    return this.auth;
  }

  /**
   * Obtiene el nombre de la colección gestionada por este servicio.
   */
  public getCollectionName(): string {
    return this.collectionName;
  }

  /**
   * Obtiene la referencia a la colección actual.
   */
  public getCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.collectionName);
  }

  /**
   * Obtiene la referencia a un documento específico por su ID.
   */
  public getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.firestore, this.collectionName, id);
  }

  /**
   * Crea un nuevo documento asociándolo obligatoriamente al usuario autenticado actual y con timestamp local.
   * @param data Datos del documento a almacenar.
   * @returns Identificador asignado al nuevo documento.
   */
  public async create(data: WithFieldValue<Omit<T, "id">>): Promise<string> {
    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) {
      throw new Error("Operación rechazada: Usuario no autenticado.");
    }

    const colRef = this.getCollectionRef();
    const payload: DocumentData = {
      ...(data as DocumentData),
      userId: currentUserId,
      createdAtLocal: (data as any).createdAtLocal || new Date().toISOString()
    };

    const docRef = await addDoc(colRef, payload as WithFieldValue<DocumentData>);
    return docRef.id;
  }

  /**
   * Actualiza parcialmente un documento específico por su ID asegurando que el usuario esté autenticado.
   * @param id Identificador del documento a actualizar.
   * @param data Campos a actualizar en el documento.
   */
  public async update(id: string, data: Partial<T>): Promise<void> {
    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) {
      throw new Error("Operación rechazada: Usuario no autenticado.");
    }

    const docRef = this.getDocRef(id);
    await updateDoc(docRef, data as DocumentData);
  }

  /**
   * Obtiene todos los documentos de la colección pertenecientes al usuario actual (aislamiento multi-tenancy).
   * Los mapea a instancias de clase modelo usando `createModel()`.
   * @param userId Identificador de usuario opcional para filtrar explícitamente.
   * @returns Lista de instancias de modelo del usuario con estado de sincronización.
   */
  public async getAll(userId?: string): Promise<ModeloBase[]> {
    const targetUserId = userId || this.auth.getCurrentUserId();
    if (!targetUserId) {
      throw new Error(`Operación rechazada: No se puede obtener "${this.collectionName}" sin usuario autenticado.`);
    }

    const colRef = this.getCollectionRef();

    const createdQuery = targetUserId
        ? query(colRef, where("userId", "==", targetUserId))
        : colRef;

    return new Promise((resolve, reject) => {
      onSnapshot(
          createdQuery,
          { includeMetadataChanges: true },
          (snapshot) => {
            const docs: ModeloBase[] = snapshot.docs.map((docSnap) => {
              const rawData = {
                ...(docSnap.data() as T),
                id: docSnap.id,
              };
              const model = this.createModel(rawData);
              model.marcarComoSincronizado(!docSnap.metadata.hasPendingWrites);
              return model;
            });
            resolve(docs);
          },
          reject
      );
    });
  }

  /**
   * Obtiene todos los documentos activos de la colección.
   * Utiliza el método esActivo() de ModeloBase para determinar si un documento está activo,
   * permitiendo que cada modelo defina su propia lógica de negocio.
   * @param userId Identificador de usuario opcional para filtrar explícitamente.
   * @returns Lista de documentos activos del usuario.
   */
  public async getAllActivos(userId?: string): Promise<ModeloBase[]> {
    const todos = await this.getAll(userId);
    return todos.filter(each => each.esActivo());
  }
}

