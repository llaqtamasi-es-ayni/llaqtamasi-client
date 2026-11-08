import { Component, ElementRef, input, output, viewChild, type AfterViewInit, type OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import type { LatLng } from '../../core';

@Component({
  selector: 'app-ubicacion-reporte',
  template: `<div #mapa class="mapa ayni-mapa" role="region" aria-label="Mapa para elegir el lugar del reporte"></div>`,
  styles: `.mapa { height: 280px; width: 100%; }`,
})
export class UbicacionReporteComponent implements AfterViewInit, OnDestroy {
  readonly limite = input<string>();
  readonly elegido = output<LatLng>();
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapa');
  private mapa?: L.Map;

  ngAfterViewInit(): void {
    const mapa = L.map(this.contenedor().nativeElement).setView([-16.3989, -71.5369], 15);
    this.mapa = mapa;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; colaboradores de OpenStreetMap',
    }).addTo(mapa);

    const coordenadas = [...(this.limite() ?? '').matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)];
    const limites = L.latLngBounds(coordenadas.map(([, lng, lat]) => L.latLng(Number(lat), Number(lng))));
    if (limites.isValid()) mapa.fitBounds(limites, { maxZoom: 16, padding: [16, 16] });

    let marcador: L.CircleMarker | undefined;
    mapa.on('click', ({ latlng }: L.LeafletMouseEvent) => {
      if (marcador) marcador.setLatLng(latlng);
      else marcador = L.circleMarker(latlng, { radius: 9, color: '#a33220', fillOpacity: 0.85 }).addTo(mapa);
      const punto = latlng.wrap();
      this.elegido.emit({ lat: punto.lat, lng: punto.lng === -180 ? 180 : punto.lng });
    });
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
