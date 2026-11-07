/** Tipos de escritura que pasan por la cola offline. Agrega aquí los nuevos. */
export type TipoAccion =
  | 'CREAR_REPORTE'
  | 'CONFIRMAR_REPORTE'
  | 'DESMENTIR_REPORTE'
  | 'CREAR_PUBLICACION_MURO'
  | 'CREAR_SOLICITUD'
  | 'ENVIAR_MENSAJE'
  | 'VOTAR_PERFIL';

/** Acción de escritura guardada en IndexedDB hasta que se pueda enviar al backend. */
export interface AccionPendiente {
  /** UUID generado en el cliente: el backend lo usa para no procesar dos veces la misma acción. */
  uuid: string;
  tipo: TipoAccion;
  payload: unknown;
  /** Fecha ISO 8601. */
  creadoEn: string;
  /** Reintentos fallidos hasta ahora (lo gestiona OfflineQueueService). */
  intentos?: number;
}
