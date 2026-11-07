/** Punto geográfico simple. Solo se usa para lugares públicos (centros, reportes). */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * GeoJSON MultiPolygon (RFC 7946). Ojo: las coordenadas van en orden [lng, lat].
 * Se usa para las zonas de atención de un proveedor: NUNCA para su casa.
 */
export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}
