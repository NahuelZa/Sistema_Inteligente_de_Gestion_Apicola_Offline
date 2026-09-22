import type { FieldValue } from 'firebase/firestore';

export interface Colmena {
<<<<<<< HEAD
  codigo: string;
=======
  colmenaId: string;
>>>>>>> f1a2a25d74861d3f0f542288994c2b6e8752f58b
  apiario_id: string;
  fecha_creacion: FieldValue | Date | string;
  estado: "habilitada" | "inhabilitada";
}
