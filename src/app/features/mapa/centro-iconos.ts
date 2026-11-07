import * as L from 'leaflet';

import type { TipoCentro } from '../../core';

/** Emoji y color por tipo de centro. Se dibujan con divIcon: no requiere imágenes. */
export const ESTILO_CENTRO: Record<TipoCentro, { emoji: string; color: string; etiqueta: string }> = {
  COMEDOR: { emoji: '🍲', color: '#e67e22', etiqueta: 'Comedor popular' },
  OLLA_COMUN: { emoji: '🥘', color: '#d35400', etiqueta: 'Olla común' },
  ADULTO_MAYOR: { emoji: '🧓', color: '#8e44ad', etiqueta: 'Adulto mayor' },
  NINOS: { emoji: '🧒', color: '#f1c40f', etiqueta: 'Niños' },
  SALUD: { emoji: '🏥', color: '#c0392b', etiqueta: 'Salud' },
  COMISARIA: { emoji: '👮', color: '#2c3e50', etiqueta: 'Comisaría' },
  ACOPIO: { emoji: '📦', color: '#27ae60', etiqueta: 'Centro de acopio' },
};

export function iconoCentro(tipo: TipoCentro): L.DivIcon {
  const { emoji, color } = ESTILO_CENTRO[tipo];
  return L.divIcon({
    className: 'ayni-marcador',
    html: `<span style="background:${color}">${emoji}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
