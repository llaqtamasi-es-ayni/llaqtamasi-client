import type { LatLng } from './geo.model';

/** Tipos de reporte. Describen situaciones o lugares, nunca personas. */
export type TipoReporte =
  'CORTE_AGUA' | 'CORTE_LUZ' | 'VIA_BLOQUEADA' | 'ACCIDENTE' | 'INCENDIO' | 'INUNDACION' | 'SISMO_DANOS' | 'OTRO';

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  ubicacion: LatLng;
  texto: string;
  /** Fecha ISO 8601. */
  creadoEn: string;
  /** Fecha ISO 8601. Pasada esta fecha el reporte deja de mostrarse. */
  expiraEn: string;
  confirmaciones: number;
  desmentidos: number;
}
