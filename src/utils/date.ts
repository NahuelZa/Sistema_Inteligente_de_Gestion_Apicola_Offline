/**
 * Retorna una fecha en formato estándar ISO local 'YYYY-MM-DD'.
 * @param date Instancia de fecha base (por defecto: fecha actual).
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
