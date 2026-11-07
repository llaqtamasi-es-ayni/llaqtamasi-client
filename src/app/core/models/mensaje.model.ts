export interface Mensaje {
  id: string;
  solicitudId: string;
  autorId: string;
  texto: string;
  /** Fecha ISO 8601. */
  fecha: string;
}
