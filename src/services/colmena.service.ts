import { FirestoreService } from "./FirestoreService";
import type { Colmena } from "../models";
import { COLLECTIONS } from "../constants";

export class ColmenaService extends FirestoreService<Colmena> {
  constructor() {
    super(COLLECTIONS.COLMENAS);
  }
}

export const colmenaService = new ColmenaService();
