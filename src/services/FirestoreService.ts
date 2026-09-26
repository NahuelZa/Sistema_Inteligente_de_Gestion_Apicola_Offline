import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  onSnapshotsInSync,
  serverTimestamp,
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

export type DocumentWithId<T> = T & { id: string, estaSincronizado?: boolean };

/**
 * Clase genérica para abstraer y encapsular el acceso y operaciones con colecciones de Cloud Firestore.
 * Proporciona métodos CRUD, persistencia offline transparente y filtrado por usuario autenticado.
 */
export class FirestoreService<T extends DocumentData = DocumentData> {
  protected readonly firestore: Firestore;
  protected readonly collectionName: string;

  constructor(collectionName: string, firestoreInstance: Firestore = defaultDb) {
    if (!collectionName || collectionName.trim() === "") {
      throw new Error("El nombre de la colección no puede estar vacío.");
    }
    this.collectionName = collectionName;
    this.firestore = firestoreInstance;
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
   * Crea un nuevo documento asociándolo automáticamente al usuario actual y con timestamp local.
   * @param data Datos del documento a almacenar.
   * @returns Identificador asignado al nuevo documento.
   */
  public async create(data: WithFieldValue<Omit<T, "id">>): Promise<string> {
    const colRef = this.getCollectionRef();
    const currentUserId = authService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error("No hay usuario autenticado. Inicia sesión para crear documentos.");
    }
    const payload: DocumentData = {
      ...(data as DocumentData),
      userId: (data as any).userId || currentUserId,
      createdAtLocal: (data as any).createdAtLocal || new Date().toISOString()
    };

    const docRef = await addDoc(colRef, payload as WithFieldValue<DocumentData>);
    return docRef.id;
  }

  /**
   * Elimina un documento específico por su ID.
   * @param id Identificador del documento a eliminar.
   */
  public async delete(id: string): Promise<void> {
    const docRef = this.getDocRef(id);
    await deleteDoc(docRef);
  }

  public onSyncDo(id: string, callback: () => void) {
    const docRef = this.getDocRef(id);
    const unsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          const isSyncedWithServer =
              !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;

          if (isSyncedWithServer) {
            callback();
            unsubscribe();
          }
        }
    );
  }

  /**
   * Obtiene todos los documentos de la colección pertenecientes al usuario actual (aislamiento multi-tenancy).
   * @param userId Identificador de usuario opcional para filtrar explícitamente.
   * @returns Lista de documentos del usuario con sus respectivos IDs.
   */
  public async getAll(userId?: string): Promise<DocumentWithId<T>[]> {
    const targetUserId = userId || authService.getCurrentUserId();
    if (!targetUserId) {
      throw new Error(`No se puede obtener "${this.collectionName}"`);
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
            const docs = snapshot.docs.map((docSnap) => ({
              ...(docSnap.data() as T),
              id: docSnap.id,
              estaSincronizado: !docSnap.metadata.hasPendingWrites,
            }));
            resolve(docs);
          },
          reject
      );
    });
  }

  // Utilidades estáticas de Firestore
  public static serverTimestamp() {
    return serverTimestamp();
  }
}
