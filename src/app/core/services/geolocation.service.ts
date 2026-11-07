import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import type { LatLng } from '../models';

/**
 * Ubicación del vecino SOLO bajo demanda.
 *
 * Reglas:
 *  - Nada de watchPosition, seguimiento continuo ni ubicación en segundo plano.
 *  - Llamar a `obtenerUbicacionActual()` únicamente tras una acción explícita del usuario
 *    (p. ej. tocar "Usar mi ubicación").
 *  - La ubicación del vecino no se guarda ni se envía salvo que la acción lo requiera
 *    (p. ej. un reporte, que describe un lugar público).
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  async obtenerUbicacionActual(): Promise<LatLng> {
    if (Capacitor.isNativePlatform()) {
      const permisos = await Geolocation.checkPermissions();
      if (permisos.location !== 'granted') {
        const respuesta = await Geolocation.requestPermissions({ permissions: ['location'] });
        if (respuesta.location !== 'granted') {
          throw new Error('Permiso de ubicación denegado');
        }
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, // precisión de red: suficiente y gasta menos batería
      timeout: 15000,
      maximumAge: 60000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
}
