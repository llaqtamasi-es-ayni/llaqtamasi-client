import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, inject, viewChild } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, type ViewDidEnter } from '@ionic/angular';
import * as L from 'leaflet';
import { firstValueFrom } from 'rxjs';

import { ApiService, type Centro } from '../../core';

import { ESTILO_CENTRO, iconoCentro } from './centro-iconos';

/** Plaza de Armas de Arequipa. */
const CENTRO_INICIAL: L.LatLngTuple = [-16.3989, -71.5369];
const ZOOM_INICIAL = 16;

@Component({
  selector: 'app-mapa',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mapa</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Mapa de servicios, tiendas y centros de ayuda -->
      <div #mapa class="mapa"></div>
    </ion-content>
  `,
  styles: `
    .mapa {
      height: 100%;
      width: 100%;
    }
  `,
})
export class MapaPage implements ViewDidEnter, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapa');
  private mapa?: L.Map;

  async ionViewDidEnter(): Promise<void> {
    if (this.mapa) {
      // Ionic reutiliza la página al cambiar de pestaña: Leaflet necesita recalcular su tamaño.
      this.mapa.invalidateSize();
      return;
    }
    this.mapa = L.map(this.contenedor().nativeElement, { zoomControl: true }).setView(CENTRO_INICIAL, ZOOM_INICIAL);

    // ------------------------------------------------------------------------------
    // MAPA OFFLINE (pendiente):
    // Hoy se usan teselas de OpenStreetMap en línea. Para el modo emergencia,
    // reemplazar esta capa por teselas del Cercado precargadas (p. ej. un paquete
    // .mbtiles/PMTiles en assets o guardadas en IndexedDB) y elegir la capa según
    // NetworkService.online$.
    // ------------------------------------------------------------------------------
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; colaboradores de OpenStreetMap',
    }).addTo(this.mapa);

    const centros = await firstValueFrom(this.api.getCentros());
    this.pintarCentros(centros);

    // TODO: pintar perfiles de proveedores SOLO como zonas de atención (L.geoJSON de
    // zonasAtencion), nunca como un punto. Ver regla 1 y 2 del README.
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  /** Los centros de ayuda son públicos: sí llevan ubicación exacta. */
  private pintarCentros(centros: Centro[]): void {
    for (const c of centros) {
      L.marker([c.ubicacion.lat, c.ubicacion.lng], { icon: iconoCentro(c.tipo), title: c.nombre })
        .bindPopup(`<strong>${c.nombre}</strong><br>${ESTILO_CENTRO[c.tipo].etiqueta}<br>${c.horario}`)
        .addTo(this.mapa!);
    }
  }
}
