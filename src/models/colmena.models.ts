import type { FieldValue } from 'firebase/firestore';

export interface Colmena {
  codigo: string;
  apiario_id: string;
  fecha_creacion: FieldValue | Date | string;
  estado: "habilitada" | "inhabilitada";
}
