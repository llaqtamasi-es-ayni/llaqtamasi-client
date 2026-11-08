import type { ElementRef, OnDestroy } from '@angular/core';
import { ChangeDetectorRef, Component, inject, viewChild } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, type ViewDidEnter } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { firstValueFrom } from 'rxjs';

import { ApiService, type Centro, type ZonaDisponible } from '../../core';

import { ESTILO_CENTRO, iconoCentro } from './centro-iconos';

/** Plaza de Armas de Arequipa. */
const CENTRO_INICIAL: L.LatLngTuple = [-16.3989, -71.5369];
const ZOOM_INICIAL = 16;

@Component({
  selector: 'app-mapa',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mapa</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (!api.usaMocks) {
        <section class="conexion">
          @if (zonas.length) {
            <label>Zona
              <select [(ngModel)]="zonaId" (ngModelChange)="cargarCentros()" [disabled]="cargando">
                @for (zona of zonas; track zona.id) {
                  <option [value]="zona.id">{{ zona.nombre }}</option>
                }
              </select>
            </label>
            <label>Tipo de centro
              <select [ngModel]="tipoCentro" (ngModelChange)="filtrarCentros($event)" [disabled]="cargando || !centros.length">
                <option value="">Todos</option>
                @for (tipo of tiposCentro; track tipo.id) {
                  <option [value]="tipo.id">{{ tipo.etiqueta }}</option>
                }
              </select>
            </label>
          }
          @if (estado) { <p role="status">{{ estado }}</p> }
        </section>
      }
      <div #mapa class="mapa"></div>
    </ion-content>
  `,
  styles: `
    .conexion { padding: 12px; display: flex; flex-wrap: wrap; gap: 8px 16px; }
    .conexion label { display: grid; gap: 4px; }
    .conexion p { flex-basis: 100%; margin: 0; }
    .mapa {
      height: 100%;
      width: 100%;
    }
  `,
})
export class MapaPage implements ViewDidEnter, OnDestroy {
  readonly api = inject(ApiService);
  private readonly cambios = inject(ChangeDetectorRef);
  estado = '';
  cargando = false;
  zonas: ZonaDisponible[] = [];
  zonaId = '';
  centros: Centro[] = [];
  tipoCentro = '';
  readonly tiposCentro = Object.entries(ESTILO_CENTRO).map(([id, { etiqueta }]) => ({ id, etiqueta }));
  private marcadores?: L.LayerGroup;
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

    this.marcadores = L.layerGroup().addTo(this.mapa);
    if (this.api.usaMocks) await this.cargarCentros();
    else await this.cargarZonas();

    // TODO: pintar perfiles de proveedores SOLO como zonas de atención (L.geoJSON de
    // zonasAtencion), nunca como un punto. Ver regla 1 y 2 del README.
  }

  private async cargarZonas(): Promise<void> {
    this.cargando = true;
    this.estado = 'Cargando zonas…';
    try {
      this.zonas = await this.api.getZonas();
      this.zonaId = this.zonas[0]?.id ?? '';
      if (this.zonaId) await this.cargarCentros();
      else this.estado = 'Conectado. El servidor aún no tiene zonas.';
    } catch {
      this.estado = 'No se pudieron cargar las zonas.';
    } finally {
      this.cargando = false;
      this.cambios.markForCheck();
      this.mapa?.invalidateSize();
    }
  }

  async cargarCentros(): Promise<void> {
    this.cargando = true;
    this.estado = 'Cargando centros…';
    this.centros = [];
    this.marcadores?.clearLayers();
    try {
      this.centros = await firstValueFrom(this.api.getCentros(this.zonaId));
      this.filtrarCentros(this.tipoCentro);
    } catch {
      this.estado = 'No se pudieron cargar los centros.';
    } finally {
      this.cargando = false;
      this.cambios.markForCheck();
    }
  }

  filtrarCentros(tipo: string): void {
    this.tipoCentro = tipo;
    const visibles = this.centros.filter(c => !tipo || c.tipo === tipo);
    this.marcadores?.clearLayers();
    this.pintarCentros(visibles);
    if (visibles.length) {
      this.mapa?.fitBounds(visibles.map(c => [c.ubicacion.lat, c.ubicacion.lng]), { maxZoom: 16 });
      this.estado = 'Centros visibles: ' + visibles.length;
    } else {
      this.estado = this.centros.length
        ? 'No hay centros de este tipo en la zona.'
        : 'Esta zona aún no tiene centros registrados.';
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  /** Los centros de ayuda son públicos: sí llevan ubicación exacta. */
  private pintarCentros(centros: Centro[]): void {
    for (const c of centros) {
      const popup = document.createElement('div');
      const nombre = document.createElement('strong');
      nombre.textContent = c.nombre;
      popup.append(nombre);
      for (const texto of [
        ESTILO_CENTRO[c.tipo].etiqueta,
        c.horario?.trim() && 'Horario: ' + c.horario,
        c.contactoPublico?.trim() && 'Contacto: ' + c.contactoPublico,
      ]) {
        if (!texto) continue;
        const linea = document.createElement('div');
        linea.textContent = texto;
        popup.append(linea);
      }
      L.marker([c.ubicacion.lat, c.ubicacion.lng], { icon: iconoCentro(c.tipo), title: c.nombre })
        .bindPopup(popup)
        .addTo(this.marcadores!);
    }
  }
}


