import { collection, doc, query, where, onSnapshot, type Firestore, type Unsubscribe } from "firebase/firestore";

/**
 * Clase dedicada a gestionar listeners de sincronización con Firestore.
 * Separa la responsabilidad de monitoreo de sync de las operaciones CRUD de FirestoreService,
 * cumpliendo con el principio SRP (Single Responsibility Principle).
 */
export class SyncListener {
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  /**
   * Suscribe un listener a nivel de colección que invoca el callback cuando todas las escrituras pendientes
   * del usuario han sido sincronizadas con el servidor. Útil para re-cargar datos después de operaciones offline.
   * @param collectionName Nombre de la colección a monitorear.
   * @param userId Identificador del usuario.
   * @param callback Callback invocado cuando no quedan escrituras pendientes y hay documentos en la colección.
   * @returns Función Unsubscribe para cancelar la suscripción.
   */
  public onSynced(
    collectionName: string,
    userId: string,
    callback: () => void
  ): Unsubscribe {
    const colRef = collection(this.firestore, collectionName);
    const userQuery = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      userQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        const hasPending = snapshot.docs.some((d) => d.metadata.hasPendingWrites);
        if (!hasPending && snapshot.docs.length > 0) {
          callback();
        }
      },
      (error) => {
        console.error(`Error en listener de sincronización para "${collectionName}":`, error);
      }
    );
  }

  /**
   * Suscribe un listener para observar en tiempo real si existen escrituras pendientes de sincronización (offline)
   * para los documentos del usuario en esta colección.
   * @param collectionName Nombre de la colección a monitorear.
   * @param userId Identificador del usuario.
   * @param callback Callback que recibe un booleano indicando si hay escrituras pendientes.
   * @returns Función Unsubscribe para cancelar la suscripción.
   */
  public onPendingWritesChange(
    collectionName: string,
    userId: string,
    callback: (hasPending: boolean) => void
  ): Unsubscribe {
    const colRef = collection(this.firestore, collectionName);
    const userQuery = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      userQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        callback(snapshot.metadata.hasPendingWrites);
      },
      (error) => {
        console.error(`Error en listener de pending writes para "${collectionName}":`, error);
      }
    );
  }

  /**
   * Suscribe un listener a un documento específico que invoca el callback cuando el documento
   * está sincronizado con el servidor (sin escrituras pendientes y no desde caché).
   * @param collectionName Nombre de la colección.
   * @param id Identificador del documento.
   * @param callback Callback invocado cuando el documento está sincronizado.
   */
  public onSyncDo(
    collectionName: string,
    id: string,
    callback: () => void
  ): void {
    const docRef = doc(this.firestore, collectionName, id);
    onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        const isSyncedWithServer =
          !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;

        if (isSyncedWithServer) {
          callback();
        }
      }
    );
  }
}
