import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { ApiService, NetworkService, OfflineQueueService, generarUuid, type ZonaDisponible, type Reporte, type LatLng } from '../../core';
import { UbicacionReporteComponent } from './ubicacion-reporte.component';

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, UbicacionReporteComponent],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Reportes y emergencia</ion-title></ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="ayni-pagina">
        <section class="emergencia ayni-tarjeta" aria-labelledby="titulo-emergencia">
          <span class="ayni-etiqueta">{{ emergencia ? 'Modo activo' : 'Modo inactivo' }}</span>
          <h1 id="titulo-emergencia">Modo emergencia</h1>
          <p>Consulta los reportes de tu zona y revisa tus envíos pendientes.</p>
          <div class="ayni-acciones" aria-live="polite">
            <span class="ayni-etiqueta">{{ network.online() ? 'En línea' : 'Sin conexión' }}</span>
            <span class="ayni-etiqueta">En cola: {{ cola.pendientes() }}</span>
          </div>
          <button type="button" [attr.aria-pressed]="emergencia" (click)="cambiarEmergencia(!emergencia)">
            {{ emergencia ? 'Desactivar modo emergencia' : 'Activar modo emergencia' }}
          </button>
        </section>
        <div class="ayni-barra">
          @if (zonas.length) {
            <label>
              Zona
              <select [ngModel]="zonaId" (ngModelChange)="cambiarZona($event)" [disabled]="ocupado">
                @for (zona of zonas; track zona.id) {
                  <option [value]="zona.id">{{ zona.nombre }}</option>
                }
              </select>
            </label>
          }
          <button type="button" class="ayni-secundario" (click)="recargar()" [disabled]="ocupado">
            Actualizar
          </button>
          @if (zonaId && verificado) {
            <button
              type="button"
              [disabled]="ocupado"
              [attr.aria-expanded]="mostrarFormulario"
              (click)="alternarFormulario()"
            >
              {{ mostrarFormulario ? 'Cerrar formulario' : '+ Nuevo reporte' }}
            </button>
          }
        </div>
        @if (ocupado) {
          <p role="status">Procesando…</p>
        }
        @if (error) {
          <p role="alert">{{ error }}</p>
        }
        @if (aviso) {
          <p role="status">{{ aviso }}</p>
        }
        @if (zonaId && verificado && mostrarFormulario) {
          <form class="ayni-tarjeta" (ngSubmit)="publicar()">
            <h2>Crear reporte</h2>
            <label>
              Tipo
              <input name="tipo" [(ngModel)]="tipo" maxlength="150" required />
            </label>
            <fieldset>
              <legend>Lugar del incidente</legend>
              <p>Marca el lugar en el mapa o escribe la dirección pública.</p>
              <label>
                Dirección o referencia
                <input
                  name="direccion"
                  [(ngModel)]="direccion"
                  maxlength="250"
                  placeholder="Ej. esquina de San Francisco con Moral"
                />
              </label>
              <button
                type="button"
                class="ayni-secundario"
                [disabled]="ocupado"
                [attr.aria-expanded]="mostrarMapa"
                (click)="alternarMapa()"
              >
                {{ mostrarMapa ? 'Quitar punto del mapa' : 'Elegir en el mapa' }}
              </button>
              @if (mostrarMapa) {
                <app-ubicacion-reporte [limite]="limiteZona" (elegido)="punto = $event" />
                <p role="status">
                  {{ punto ? 'Punto seleccionado.' : 'Toca el lugar del incidente en el mapa.' }}
                </p>
              }
            </fieldset>
            <label>
              Duración (horas)
              <input name="horas" type="number" [(ngModel)]="horas" min="1" max="24" required />
            </label>
            <label>
              Descripción
              <textarea name="texto" [(ngModel)]="texto" maxlength="2000" required></textarea>
            </label>
            <button type="submit" [disabled]="ocupado || (!punto && !direccion.trim())">Publicar</button>
          </form>
        } @else if (verificado === false) {
          <p class="ayni-vacio">Solo las cuentas verificadas pueden crear reportes.</p>
        }
        <section class="ayni-seccion" aria-labelledby="titulo-reportes">
          <h2 id="titulo-reportes">Reportes vigentes</h2>
          @for (item of items; track item.id) {
            <article class="ayni-tarjeta">
              <h3>{{ item.tipo.replaceAll('_', ' ') }}</h3>
              <p class="ayni-texto">{{ item.texto }}</p>
              @if (item.direccion) {
                <p>
                  <strong>Lugar:</strong>
                  {{ item.direccion }}
                </p>
              }
              @if (item.ubicacion; as ubicacion) {
                <p>
                  <strong>Punto en el mapa:</strong>
                  {{ ubicacion.lat.toFixed(5) }},
                  {{ ubicacion.lng.toFixed(5) }}
                </p>
              }
              <div class="ayni-acciones">
                <span class="ayni-etiqueta">Confirmaciones: {{ item.confirmaciones }}</span>
                <span class="ayni-etiqueta">Desmentidos: {{ item.desmentidos }}</span>
              </div>
              @if (usuarioId && item.autorId !== usuarioId) {
                <div class="ayni-acciones">
                  <button type="button" (click)="responder(item.id, 'CONFIRMA')" [disabled]="ocupado">
                    Confirmar
                  </button>
                  <button
                    type="button"
                    class="ayni-secundario"
                    (click)="responder(item.id, 'DESMIENTE')"
                    [disabled]="ocupado"
                  >
                    Desmentir
                  </button>
                </div>
              }
            </article>
          } @empty {
            @if (!ocupado && !error) {
              <p class="ayni-vacio">
                {{ zonaId ? 'No hay reportes vigentes.' : 'No hay zonas disponibles.' }}
              </p>
            }
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: `
    .emergencia {
      --ion-color-primary: var(--ayni-emergency-primary);
      --ayni-accent: var(--ayni-emergency-accent);
      --ayni-accent-soft: var(--ayni-emergency-accent-soft);
      background: var(--ayni-emergency-background);
      border-color: var(--ayni-emergency-border);
      border-inline-start: 4px solid var(--ayni-emergency-primary);
      color: var(--ayni-emergency-primary);
    }
    .emergencia h1 { margin-top: 10px; }
    .emergencia button { margin-top: 14px; }
    fieldset { min-width: 0; margin: 0; padding: 12px; border: 1px solid var(--ayni-border); border-radius: 12px; }
    fieldset button { margin-block: 10px; }
  `,
})
export class ReportesPage {
  readonly network = inject(NetworkService);
  readonly cola = inject(OfflineQueueService);
  private readonly document = inject(DOCUMENT);
  emergencia = false;
  mostrarFormulario = false;
  private readonly api = inject(ApiService);
  private readonly cambios = inject(ChangeDetectorRef);
  zonas: ZonaDisponible[] = [];
  items: Reporte[] = [];
  zonaId = '';
  ocupado = false;
  error = '';
  aviso = '';
  texto = '';
  verificado: boolean | null = null;
  usuarioId = '';
  tipo = 'VIA_BLOQUEADA';
  direccion = '';
  punto: LatLng | null = null;
  mostrarMapa = false;
  horas: number | null = 3;

  ionViewWillEnter(): void {
    void this.recargar();
  }

  ionViewWillLeave(): void {
    this.cambiarEmergencia(false);
  }

  cambiarEmergencia(activa: boolean): void {
    this.emergencia = activa;
    this.document.documentElement.classList.toggle('modo-emergencia', activa);
  }

  cambiarZona(id: string): void {
    this.zonaId = id;
    this.items = [];
    this.aviso = '';
    this.punto = null;
    this.mostrarMapa = false;
    void this.recargar();
  }

  get limiteZona(): string | undefined {
    return this.zonas.find(zona => zona.id === this.zonaId)?.limite_wkt;
  }

  alternarFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.mostrarMapa = false;
      this.punto = null;
    }
  }

  alternarMapa(): void {
    this.mostrarMapa = !this.mostrarMapa;
    if (!this.mostrarMapa) this.punto = null;
  }

  async recargar(): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = '';
    try {
      this.zonas = await this.api.getZonas();
      if (!this.zonas.some(z => z.id === this.zonaId)) this.zonaId = this.zonas[0]?.id ?? '';
      this.verificado = null;
      this.usuarioId = '';
      const perfil = await this.api.getMiPerfil();
      this.usuarioId = perfil.id;
      this.verificado = perfil.verificado === true || perfil.verificado === 1;
      this.items = this.zonaId ? await firstValueFrom(this.api.getReportes(this.zonaId)) : [];
    } catch {
      this.error = 'No se pudieron cargar los datos. Pulsa Actualizar para reintentar.';
    } finally {
      this.ocupado = false;
      this.cambios.markForCheck();
    }
  }

  async publicar(): Promise<void> {
    if (this.ocupado || !this.zonaId) return;
    const { punto, horas } = this;
    const direccion = this.direccion.trim();
    if (!this.verificado) return;
    if (!this.tipo.trim() || !this.texto.trim() || (!punto && !direccion)
      || horas === null || !Number.isInteger(horas) || horas < 1 || horas > 24) {
      this.error = 'Completa el tipo, la descripción y el lugar. La duración debe ser de 1 a 24 horas.';
      return;
    }
    await this.guardar(async () => {
      await this.api.publicarReporte({
        id: generarUuid(), tipo: this.tipo.trim(), texto: this.texto.trim(),
        lat: punto?.lat ?? null, lng: punto?.lng ?? null, direccion, zonaId: this.zonaId, duracionHoras: horas,
      });
      this.texto = '';
      this.direccion = '';
      this.punto = null;
      this.mostrarMapa = false;
      this.mostrarFormulario = false;
    }, 'Reporte publicado. Ya puedes consultarlo en la zona seleccionada.');
  }

  async responder(id: string, decision: 'CONFIRMA' | 'DESMIENTE'): Promise<void> {
    await this.guardar(() => this.api.responderReporte(id, decision), 'Respuesta registrada.');
  }

  private async guardar(enviar: () => Promise<void>, mensaje: string): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = '';
    this.aviso = '';
    try {
      await enviar();
      this.aviso = mensaje;
    } catch (error: unknown) {
      const prohibido = typeof error === 'object' && error !== null && 'status' in error && error.status === 403;
      this.error = prohibido ? 'Tu cuenta no tiene permiso para esta acción.'
        : 'No se pudo confirmar el envío. Actualiza la lista antes de reintentar.';
    } finally {
      this.ocupado = false;
      this.cambios.markForCheck();
    }
    if (!this.error) await this.recargar();
  }
}
