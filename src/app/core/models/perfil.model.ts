import type { GeoJsonMultiPolygon } from './geo.model';

export type TipoPerfil = 'SERVICIO' | 'TIENDA' | 'APOYO';

/**
 * Perfil público de un proveedor (servicio, tienda o apoyo).
 * Regla: no lleva dirección, coordenadas de casa ni teléfono. Solo zonas de atención.
 */
export interface Perfil {
  id: string;
  usuarioId: string;
  tipo: TipoPerfil;
  categoria: string;
  descripcion: string;
  zonasAtencion: GeoJsonMultiPolygon;
  visible: boolean;
  /** Promedio de votos de vecinos (1-5). */
  confianza: number;
}
