import { accessibility, cube, flame, happy, medkit, restaurant, shieldCheckmark } from 'ionicons/icons';
import * as L from 'leaflet';

import type { TipoCentro } from '../../core';

/**
 * Familias de color de los centros. Son pocas a propósito: el color agrupa y el icono
 * distingue el tipo, así el mapa no se satura y se entiende también sin percibir el color.
 */
const ALIMENTACION = '#8b482f';
const CUIDADO = '#176354';
const SALUD_Y_SEGURIDAD = '#393b7a';
const DONACIONES = '#604a82';

/** Icono y color por tipo de centro. Se dibujan con divIcon: no requiere imágenes. */
export const ESTILO_CENTRO: Record<TipoCentro, { icono: string; color: string; etiqueta: string }> = {
  COMEDOR: { icono: restaurant, color: ALIMENTACION, etiqueta: 'Comedor popular' },
  OLLA_COMUN: { icono: flame, color: ALIMENTACION, etiqueta: 'Olla común' },
  ADULTO_MAYOR: { icono: accessibility, color: CUIDADO, etiqueta: 'Adulto mayor' },
  NINOS: { icono: happy, color: CUIDADO, etiqueta: 'Niños' },
  SALUD: { icono: medkit, color: SALUD_Y_SEGURIDAD, etiqueta: 'Salud' },
  COMISARIA: { icono: shieldCheckmark, color: SALUD_Y_SEGURIDAD, etiqueta: 'Comisaría' },
  ACOPIO: { icono: cube, color: DONACIONES, etiqueta: 'Centro de acopio' },
};

/** ionicons exporta cada icono como data URI; aquí se inserta su SVG en línea para colorearlo por CSS. */
const svgDe = (icono: string): string => icono.replace('data:image/svg+xml;utf8,', '');

export function iconoCentro(tipo: TipoCentro): L.DivIcon {
  const { icono, color } = ESTILO_CENTRO[tipo];
  return L.divIcon({
    className: 'ayni-marcador',
    html: `<span style="background:${color}">${svgDe(icono)}</span>`,
    iconSize: [36, 36],
    // Punta del pin: el cuadrado de 36 px girado 45° termina unos 25 px bajo su centro.
    iconAnchor: [18, 43],
    popupAnchor: [0, -40],
  });
}
