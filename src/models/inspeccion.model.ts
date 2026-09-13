import type { FieldValue } from "firebase/firestore";

export interface Inspeccion {
  colmenaId: string;
  userId: string;
  notas: string;
  fecha: FieldValue | Date | string;
  createdAtLocal: string;
}
