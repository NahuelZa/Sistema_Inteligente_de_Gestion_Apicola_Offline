export const VIEWS = {
  LOGIN: "login",
  APIARIO: "apiario",
  COLMENA: "colmena",
  INSPECCION: "inspeccion",
  LISTADO_APIARIOS: "apiarios",
  LISTADO_COLMENAS: "colmenas",
  LISTADO_INSPECCIONES: "inspecciones",
  LISTADO: "apiarios",
} as const;

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  APIARIO: "/apiario",
  COLMENA: "/colmena",
  INSPECCION: "/inspeccion",
  NUEVA_INSPECCION: "/nueva-inspeccion",
  COLMENAS: "/colmenas",
  APIARIOS: "/apiarios",
  INSPECCIONES: "/inspecciones",
  LISTADO_APIARIOS: "/apiarios",
  LISTADO_COLMENAS: "/colmenas",
  LISTADO_INSPECCIONES: "/inspecciones",
  LISTADO: "/listado",
} as const;

export const COLLECTIONS = {
  APIARIOS: "apiarios",
  COLMENAS: "colmenas",
  INSPECCIONES: "inspecciones",
} as const;
