import type { LatLng } from './geo.model';

export type TipoCentro = 'COMEDOR' | 'OLLA_COMUN' | 'ADULTO_MAYOR' | 'NINOS' | 'SALUD' | 'COMISARIA' | 'ACOPIO';

/** Centro de ayuda público: este SÍ lleva ubicación exacta. */
export interface Centro {
  id: string;
  nombre: string;
  tipo: TipoCentro;
  ubicacion: LatLng;
  horario: string;
  contactoPublico?: string | null;
}
