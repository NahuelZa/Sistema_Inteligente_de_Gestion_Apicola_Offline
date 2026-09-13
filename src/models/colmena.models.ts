import type { FieldValue } from 'firebase/firestore';

export interface Colmena {
  colmenaId: string;
  apiario_id: string;
  fecha_creacion: FieldValue | Date | string;
  estado: "habilitada" | "inhabilitada";
}
