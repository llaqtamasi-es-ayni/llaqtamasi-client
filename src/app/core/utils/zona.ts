import type { GeoJsonMultiPolygon, LatLng } from '../models';

/**
 * ¿La zona de atención del proveedor cubre el punto del vecino?
 *
 * Regla del proyecto: NUNCA calcular distancia a un proveedor. Solo se responde sí/no.
 * El punto del vecino se usa en memoria para esta comprobación y no se guarda.
 */
export function zonaCubre(zona: GeoJsonMultiPolygon, punto: LatLng): boolean {
  return zona.coordinates.some((poligono) => {
    const [exterior, ...huecos] = poligono;
    return dentroDeAnillo(exterior, punto) && !huecos.some((h) => dentroDeAnillo(h, punto));
  });
}

/** Ray casting. Los anillos GeoJSON vienen como [lng, lat]. */
function dentroDeAnillo(anillo: number[][], { lat, lng }: LatLng): boolean {
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}
