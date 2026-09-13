import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
  type Unsubscribe,
  type WithFieldValue
} from "firebase/firestore";
import { db as defaultDb } from "../config/firebase";

export interface FirestoreDocumentMetadata {
  hasPendingWrites: boolean;
  fromCache: boolean;
}

export type DocumentWithId<T> = T & { id: string };

/**
 * Clase genérica para abstraer y encapsular el acceso y operaciones con colecciones de Cloud Firestore.
 * Proporciona métodos CRUD fuertemente tipados, consultas parametrizadas y suscripciones en tiempo real.
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
   * Crea un nuevo documento con un identificador generado automáticamente.
   * @param data Datos del documento a almacenar.
   * @returns Identificador asignado al nuevo documento.
   */
  public async create(data: WithFieldValue<Omit<T, "id">>): Promise<string> {
    const colRef = this.getCollectionRef();
    const docRef = await addDoc(colRef, data as WithFieldValue<DocumentData>);
    return docRef.id;
  }

  /**Crear documento con ID definido por usuario y verificar que no existe ya si existe
   * no te deja guardar
   */

  public async createWithUniqueId(id: string,data: WithFieldValue<Omit<T, "id">>): Promise<string> {
  const cleanId = id.trim();
  // obtiene la referencia al documento con el ID proporcionado
  const docRef = this.getDocRef(cleanId);
  // verifica si el documento ya existe pasandole la referencia como parametro
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    throw new Error(`La colmena con ID '${cleanId}' ya existe.`);
  }

  await setDoc(docRef, data as WithFieldValue<DocumentData>);
  return cleanId;
}

  /**
   * Escucha cambios en tiempo real en un documento específico.
   * @param id Identificador del documento.
   * @param callback Función invocada en cada cambio con los datos y los metadatos (ej. sincronización offline).
   * @param onError Callback opcional en caso de error.
   * @returns Función para cancelar la suscripción.
   */
  public listenById(
    id: string,
    callback: (data: DocumentWithId<T> | null, metadata: FirestoreDocumentMetadata) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = this.getDocRef(id);

    return onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        const metadata: FirestoreDocumentMetadata = {
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
          fromCache: snapshot.metadata.fromCache
        };

        if (!snapshot.exists()) {
          callback(null, metadata);
          return;
        }

        const data: DocumentWithId<T> = {
          ...(snapshot.data() as T),
          id: snapshot.id
        };

        callback(data, metadata);
      },
      onError
    );
  }

  // Utilidades estáticas de Firestore
  public static serverTimestamp() {
    return serverTimestamp();
  }
}
