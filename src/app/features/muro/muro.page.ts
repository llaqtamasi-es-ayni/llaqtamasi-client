import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { ApiService, generarUuid, type TipoPerfil, type ZonaDisponible, type PublicacionMuro, type TipoPublicacion } from '../../core';

const NOMBRES_PERFIL: Record<TipoPerfil, string> = {
  SERVICIO: 'Servicio',
  TIENDA: 'Tienda',
  APOYO: 'Apoyo',
};

@Component({
  selector: 'app-muro',
  imports: [RouterLink, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Muro vecinal</ion-title></ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="ayni-pagina">
        <section class="ayni-encabezado" aria-labelledby="titulo-muro">
          <span class="ayni-etiqueta">Comunidad</span>
          <h1 id="titulo-muro">Cadena de favores</h1>
          <p>Pide ayuda, ofrece un favor o encuentra servicios y locales de tu zona.</p>
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
              [attr.aria-expanded]="mostrarFormulario"
              [disabled]="ocupado"
              (click)="mostrarFormulario = !mostrarFormulario"
            >
              {{ mostrarFormulario ? 'Cerrar formulario' : '+ Publicar' }}
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
            <h2>Nueva publicación</h2>
            <label>
              Qué quieres publicar
              <select name="formato" [(ngModel)]="formato">
                <option value="aviso">Aviso vecinal</option>
                <option value="servicio">Servicio calificable</option>
                <option value="establecimiento">Local o establecimiento</option>
              </select>
            </label>
            @if (formato !== 'aviso') {
              @if (formato === 'establecimiento') {
                <label>
                  Nombre del establecimiento
                  <input name="establecimiento" [(ngModel)]="nombreEstablecimiento" maxlength="150" required />
                </label>
              }
              <p>La publicación aparecerá junto a los avisos de la zona seleccionada.</p>
              <label>
                Categoría
                <select name="categoriaServicio" [(ngModel)]="categoriaServicio" required>
                  <option value="">Elige una categoría</option>
                  @for (opcion of categorias; track opcion.id) {
                    <option [value]="opcion.id">{{ opcion.nombre }}</option>
                  }
                </select>
              </label>
              @if (!categorias.length) {
                <p>No hay categorías de trabajo activas disponibles.</p>
              }
            } @else {
              <label>
                Tipo
                <select name="tipo" [(ngModel)]="tipo">
                  <option value="OFREZCO">Ofrezco</option>
                  <option value="NECESITO">Necesito</option>
                </select>
              </label>
              <label>
                Asunto
                <input name="asunto" [(ngModel)]="categoria" maxlength="150" required />
              </label>
              <label>
                Duración del aviso (horas)
                <input
                  name="duracion"
                  type="number"
                  [(ngModel)]="duracionHoras"
                  min="1"
                  max="720"
                  step="1"
                  required
                />
              </label>
            }
            <label>
              Descripción
              <textarea name="texto" [(ngModel)]="texto" maxlength="4000" required></textarea>
            </label>
            <button type="submit" [disabled]="ocupado">Publicar</button>
          </form>
        }
        <section class="ayni-seccion" aria-labelledby="titulo-publicaciones">
          <h2 id="titulo-publicaciones">Publicaciones de la zona</h2>
          <label>
            Buscar por asunto
            <input type="search" [(ngModel)]="busqueda" placeholder="Ej. reparación o herramientas" />
          </label>
          @if (errorPerfiles) {
            <p role="status">No se pudieron cargar los servicios de esta zona.</p>
            <button type="button" [disabled]="ocupado || cargandoPerfiles" (click)="cargarPerfiles()">
              Reintentar
            </button>
          }
          @if (avisoSolicitud) {
            <p role="status">{{ avisoSolicitud }}</p>
          }
          @for (entrada of publicaciones; track entrada.clave) {
            @if (entrada.perfil; as perfil) {
              <article class="ayni-tarjeta">
                <h3>{{ perfil.nombre_establecimiento || perfil.alias }}</h3>
                <span class="ayni-etiqueta">{{ nombresPerfil[perfil.tipo] }}</span>
                @if (perfil.nombre_establecimiento) {
                  <p>Publicado por {{ perfil.alias }}</p>
                }
                <p class="ayni-texto">{{ perfil.descripcion }}</p>
                <p>
                  {{ perfil.votos ? perfil.confianza.toFixed(2) + '/5 · Votos: ' + perfil.votos : 'Sin votos' }}
                </p>
                @if (usuarioId && perfil.usuarioId !== usuarioId) {
                  <button type="button" [disabled]="enviandoSolicitud" (click)="elegirPerfil(perfil.id)">
                    Solicitar
                  </button>
                }
                @if (perfilSolicitud === perfil.id) {
                  <form class="ayni-seccion" (ngSubmit)="solicitar(perfil.id)">
                    <label>
                      Mensaje inicial
                      <textarea
                        name="mensaje"
                        [(ngModel)]="mensajeSolicitud"
                        maxlength="2000"
                        required
                      ></textarea>
                    </label>
                    <button type="submit" [disabled]="enviandoSolicitud || !mensajeSolicitud.trim()">
                      Enviar solicitud
                    </button>
                  </form>
                }
              </article>
            } @else if (entrada.aviso; as item) {
              <article class="ayni-tarjeta">
                @if (usuarioId) {
                  <a class="aviso-enlace" [routerLink]="['/tabs/muro/aviso', item.id, usuarioId]">
                    <span class="ayni-etiqueta">{{ item.tipo === 'OFREZCO' ? 'Ofrezco' : 'Necesito' }}</span>
                    <h3>{{ item.categoria }}</h3>
                    <p class="ayni-texto">{{ item.texto }}</p>
                    @if (item.expiraEn) {
                      <p>
                        <small>Vence: {{ fechaVencimiento(item.expiraEn) }}</small>
                      </p>
                    }
                    <span class="ayni-enlace">Ver aviso</span>
                  </a>
                }
                @if (usuarioId && item.autorId === usuarioId) {
                  <div class="ayni-acciones">
                    @if (avisoPorRetirar === item.id) {
                      <button type="button" [disabled]="ocupado" (click)="retirar(item.id)">
                        Confirmar retiro
                      </button>
                      <button
                        type="button"
                        class="ayni-secundario"
                        [disabled]="ocupado"
                        (click)="avisoPorRetirar = ''"
                      >
                        Cancelar
                      </button>
                    } @else {
                      <button
                        type="button"
                        class="ayni-secundario"
                        [disabled]="ocupado"
                        (click)="avisoPorRetirar = item.id"
                      >
                        Retirar aviso
                      </button>
                    }
                  </div>
                }
              </article>
            }
          } @empty {
            @if (!ocupado && !cargandoPerfiles && !error && !errorPerfiles) {
              <p class="ayni-vacio">
                {{
                  !zonaId
                    ? 'No hay zonas disponibles.'
                    : busqueda.trim()
                      ? 'No encontramos coincidencias.'
                      : 'Todavía no hay publicaciones en esta zona.'
                }}
              </p>
            }
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: `
    .aviso-enlace { display: block; text-decoration: none; }
    .aviso-enlace h3 { margin-top: 10px; }
    .aviso-enlace p { color: var(--ion-text-color); font-weight: 400; }
    .aviso-enlace .ayni-enlace { text-decoration: underline; }
  `,
})
export class MuroPage {
  private readonly api = inject(ApiService);
  private readonly cambios = inject(ChangeDetectorRef);
  zonas: ZonaDisponible[] = [];
  items: PublicacionMuro[] = [];
  zonaId = '';
  ocupado = false;
  error = '';
  aviso = '';
  verificado: boolean | null = null;
  usuarioId = '';
  mostrarFormulario = false;
  texto = '';
  busqueda = '';
  perfiles?: Array<{ id: string; usuarioId: string; alias: string; tipo: TipoPerfil; descripcion: string; confianza: number; votos: number; nombre_establecimiento?: string | null }>;
  perfilSolicitud = '';
  mensajeSolicitud = '';
  avisoSolicitud = '';
  enviandoSolicitud = false;
  cargandoPerfiles = false;
  errorPerfiles = false;
  readonly nombresPerfil = NOMBRES_PERFIL;
  tipo: TipoPublicacion = 'OFREZCO';
  categoria = '';
  duracionHoras: number | null = 24;
  avisoPorRetirar = '';
  private reloj?: ReturnType<typeof setInterval>;

  get avisosVigentes(): PublicacionMuro[] {
    const ahora = Date.now();
    return this.items.filter(item => !item.expiraEn || Date.parse(item.expiraEn) > ahora);
  }

  fechaVencimiento(fecha: string): string {
    return new Date(fecha).toLocaleString();
  }

  async retirar(id: string): Promise<void> {
    if (!this.usuarioId || !this.items.some(item => item.id === id && item.autorId === this.usuarioId)) return;
    await this.guardar(async () => {
      await this.api.retirarAviso(id);
      this.items = this.items.filter(item => item.id !== id);
      this.avisoPorRetirar = '';
    }, 'Aviso retirado.');
  }
  formato: 'aviso' | 'servicio' | 'establecimiento' = 'aviso';
  nombreEstablecimiento = '';
  categoriaServicio = '';
  categorias: Array<{ id: string; nombre: string }> = [];
  private consultaPerfiles = 0;

  elegirPerfil(id: string): void {
    this.perfilSolicitud = this.perfilSolicitud === id ? '' : id;
    this.mensajeSolicitud = '';
    this.avisoSolicitud = '';
  }

  async solicitar(id: string): Promise<void> {
    const mensaje = this.mensajeSolicitud.trim();
    if (this.enviandoSolicitud || !mensaje) return;
    this.enviandoSolicitud = true;
    this.avisoSolicitud = '';
    try {
      await this.api.crearSolicitud(generarUuid(), id, mensaje);
      this.perfilSolicitud = '';
      this.mensajeSolicitud = '';
      this.avisoSolicitud = 'Solicitud enviada. Puedes verla en Perfil → Mis solicitudes.';
    } catch (error: unknown) {
      this.avisoSolicitud = typeof error === 'object' && error !== null && 'status' in error && error.status === 403
        ? 'Tu cuenta no tiene permiso para solicitar este perfil.'
        : 'No se pudo confirmar el envío. Revisa Mis solicitudes antes de reintentar.';
    } finally {
      this.enviandoSolicitud = false;
      this.cambios.markForCheck();
    }
  }

  get publicaciones(): Array<{ clave: string; aviso?: PublicacionMuro; perfil?: NonNullable<MuroPage['perfiles']>[number] }> {
    const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const termino = normalizar(this.busqueda.trim());
    const avisos = this.avisosVigentes
      .filter(aviso => normalizar(aviso.categoria).includes(termino))
      .map(aviso => ({ clave: 'aviso-' + aviso.id, aviso }));
    const servicios = (this.perfiles ?? [])
      .filter(perfil => normalizar([perfil.nombre_establecimiento, perfil.alias, perfil.descripcion].join(' ')).includes(termino))
      .map(perfil => ({ clave: 'servicio-' + perfil.id, perfil }));
    return [...avisos, ...servicios];
  }

  async cargarPerfiles(): Promise<void> {
    const consulta = ++this.consultaPerfiles;
    this.cargandoPerfiles = true;
    this.errorPerfiles = false;
    this.perfiles = undefined;
    try {
      const perfiles = this.zonaId ? await firstValueFrom(this.api.getPerfilesDeZona(this.zonaId)) : [];
      if (consulta === this.consultaPerfiles) this.perfiles = perfiles;
    } catch {
      if (consulta === this.consultaPerfiles) this.errorPerfiles = true;
    } finally {
      if (consulta === this.consultaPerfiles) {
        this.cargandoPerfiles = false;
        this.cambios.markForCheck();
      }
    }
  }

  ionViewWillEnter(): void {
    this.detenerReloj();
    this.reloj = setInterval(() => this.cambios.markForCheck(), 1000);
    this.mostrarFormulario = false;
    void this.recargar();
  }

  ionViewWillLeave(): void {
    this.detenerReloj();
  }

  ngOnDestroy(): void {
    this.detenerReloj();
  }

  private detenerReloj(): void {
    clearInterval(this.reloj);
    this.reloj = undefined;
  }

  cambiarZona(id: string): void {
    this.zonaId = id;
    this.items = [];
    this.perfiles = undefined;
    this.perfilSolicitud = '';
    this.aviso = '';
    void this.recargar();
  }

  async recargar(): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = '';
    this.verificado = null;
    try {
      this.zonas = await this.api.getZonas();
      if (!this.zonas.some(z => z.id === this.zonaId)) this.zonaId = this.zonas[0]?.id ?? '';
      this.items = this.zonaId ? await firstValueFrom(this.api.getPublicacionesMuro(this.zonaId)) : [];
      const perfil = await this.api.getMiPerfil();
      this.usuarioId = perfil.id;
      this.verificado = perfil.verificado === true || perfil.verificado === 1;
      await this.cargarPerfiles();
      this.categorias = this.verificado ? await this.api.categoriasDeTrabajo() : [];
    } catch {
      this.error = 'No se pudieron cargar los datos. Pulsa Actualizar para reintentar.';
    } finally {
      this.ocupado = false;
      this.cambios.markForCheck();
    }
  }

  async publicar(): Promise<void> {
    if (this.ocupado || !this.zonaId || !this.verificado) return;
    const esServicio = this.formato !== 'aviso';
    const esLocal = this.formato === 'establecimiento';
    const nombre = this.nombreEstablecimiento.trim();
    if (esLocal && !nombre) {
      this.error = 'Escribe el nombre del establecimiento.';
      return;
    }
    const duracion = this.duracionHoras;
    if (!esServicio && (duracion === null || !Number.isInteger(duracion) || duracion < 1 || duracion > 720)) {
      this.error = 'Indica una duración de 1 a 720 horas enteras.';
      return;
    }
    const area = this.zonas.find(z => z.id === this.zonaId)?.limite_wkt;
    if (!this.texto.trim() || (esServicio ? !this.categoriaServicio || !area : !this.categoria.trim())) {
      this.error = esServicio ? 'Elige una categoría y escribe la descripción.' : 'Completa el asunto y la descripción.';
      return;
    }
    await this.guardar(async () => {
      if (esServicio && area) {
        await this.api.publicarServicio(generarUuid(), this.categoriaServicio, this.texto.trim(), area, esLocal ? nombre : undefined);
      } else {
        await this.api.publicarMuro({
          id: generarUuid(), zonaId: this.zonaId, tipo: this.tipo,
          categoria: this.categoria.trim(), texto: this.texto.trim(),
          duracionHoras: duracion ?? 24,
        });
      }
      this.texto = '';
      this.categoria = '';
      this.nombreEstablecimiento = '';
      this.mostrarFormulario = false;
    }, esLocal ? 'Establecimiento publicado.' : esServicio ? 'Servicio publicado en el Muro.' : 'Aviso publicado.');
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
