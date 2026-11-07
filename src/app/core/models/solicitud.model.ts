export type EstadoSolicitud = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'FINALIZADA';

export interface Solicitud {
  id: string;
  vecinoId: string;
  perfilId: string;
  mensaje: string;
  estado: EstadoSolicitud;
}
