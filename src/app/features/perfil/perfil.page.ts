import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, NavController } from '@ionic/angular';

import { ApiService, type SolicitudApi, type VecinoParaAval } from '../../core/services/api.service';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Mi perfil</h1>
      @if (perfil(); as vecino) {
        <dl>
          <dt>Alias</dt><dd>{{ vecino.alias }}</dd>
          <dt>Estado de verificación</dt>
          <dd>{{ vecino.verificado ? 'Cuenta verificada' : 'Cuenta sin verificar' }}</dd>
        </dl>
        @if (vecino.verificado === true || vecino.verificado === 1) {
          <ion-button type="button" [attr.aria-expanded]="mostrarAval()" [disabled]="ocupadoAval()"
            (click)="mostrarAval.set(!mostrarAval())">
            {{ mostrarAval() ? 'Cerrar búsqueda' : 'Recomendar vecino' }}
          </ion-button>
          @if (mostrarAval()) {
            <section aria-label="Recomendar vecino">
              <p>Con dos avales de cuentas verificadas distintas, el vecino obtiene la verificación.</p>
              <form (ngSubmit)="buscarVecinos()">
                <label for="buscar-vecino">Alias o nombre de usuario</label>
                <input id="buscar-vecino" name="consultaAval" type="search" [(ngModel)]="consultaAval"
                  maxlength="150" [disabled]="ocupadoAval()" />
                <ion-button type="submit" [disabled]="ocupadoAval() || consultaAval.trim().length < 2">Buscar</ion-button>
              </form>
              @if (avisoAval()) { <p role="status">{{ avisoAval() }}</p> }
              @for (resultado of vecinosAval(); track resultado.id) {
                <article>
                  <strong>{{ resultado.alias }}</strong> · {{ resultado.nombre_acceso }}
                  @if (resultado.ya_avalado) {
                    <p>Ya recomendaste a esta cuenta.</p>
                  } @else {
                    <ion-button type="button" [disabled]="ocupadoAval()" (click)="recomendar(resultado)">
                      Dar aval
                    </ion-button>
                  }
                </article>
              }
            </section>
          }
        }
        <h2>Mis solicitudes</h2>
        <ion-button fill="outline" [disabled]="ocupado()" (click)="actualizarSolicitudes()">Actualizar</ion-button>
        @if (aviso()) { <p role="status">{{ aviso() }}</p> }
        @for (solicitud of solicitudes(); track solicitud.id) {
          <article>
            <h3>{{ solicitud.vecino_id === vecino.id ? 'Enviada' : 'Recibida' }} · {{ solicitud.estado }}</h3>
            <p>{{ solicitud.mensaje_inicial }}</p>
            @if (solicitud.estado === 'PENDIENTE' && solicitud.vecino_id !== vecino.id) {
              <ion-button [disabled]="ocupado()" (click)="cambiarEstado(solicitud.id, 'ACEPTADA')">Aceptar</ion-button>
              <ion-button [disabled]="ocupado()" (click)="cambiarEstado(solicitud.id, 'RECHAZADA')">Rechazar</ion-button>
            }
            @if (solicitud.estado === 'ACEPTADA') {
              <ion-button [disabled]="ocupado()" (click)="cambiarEstado(solicitud.id, 'FINALIZADA')">Finalizar</ion-button>
            }
            @if (solicitud.estado === 'FINALIZADA' && solicitud.vecino_id === vecino.id && !solicitud.perfil_calificado) {
              <label>Calificar perfil
                <select #estrellas>
                  <option value="">Elige de 1 a 5 estrellas</option>
                  @for (valor of valores; track valor) {
                    <option [value]="valor">{{ valor }} / 5</option>
                  }
                </select>
              </label>
              <ion-button [disabled]="ocupado()" (click)="votar(solicitud.id, estrellas.value)">Guardar voto</ion-button>
            }
            @if (solicitud.estado === 'FINALIZADA' && solicitud.vecino_id !== vecino.id && !solicitud.vecino_calificado) {
              <label>Calificar al vecino
                <select #nota>
                  <option value="">Elige de 1 a 5 estrellas</option>
                  @for (valor of valores; track valor) {
                    <option [value]="valor">{{ valor }} / 5</option>
                  }
                </select>
              </label>
              <ion-button [disabled]="ocupado()" (click)="calificarVecino(solicitud.id, nota.value)">Guardar calificación</ion-button>
            }
          </article>
        } @empty {
          @if (!ocupado() && !aviso()) { <p>Todavía no hay solicitudes.</p> }
        }
      } @else if (error()) {
        <p role="alert">No se pudo cargar tu perfil.</p>
        <ion-button fill="outline" (click)="cargarPerfil()">Reintentar</ion-button>
      } @else {
        <p role="status">Cargando perfil…</p>
      }
      <ion-button (click)="salir()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class PerfilPage {
  private readonly api = inject(ApiService);
  private readonly nav = inject(NavController);
  readonly perfil = signal<Awaited<ReturnType<ApiService['getMiPerfil']>> | null>(null);
  readonly error = signal(false);
  readonly solicitudes = signal<SolicitudApi[]>([]);
  readonly ocupado = signal(false);
  readonly aviso = signal('');
  readonly valores = [1, 2, 3, 4, 5];
  readonly mostrarAval = signal(false);
  readonly ocupadoAval = signal(false);
  readonly vecinosAval = signal<VecinoParaAval[]>([]);
  readonly avisoAval = signal('');
  consultaAval = '';

  ionViewWillEnter(): void {
    this.mostrarAval.set(false);
    this.vecinosAval.set([]);
    this.avisoAval.set('');
    this.consultaAval = '';
    void this.cargarPerfil();
  }

  async buscarVecinos(): Promise<void> {
    const consulta = this.consultaAval.trim();
    if (consulta.length < 2 || this.ocupadoAval()) return;
    this.vecinosAval.set([]);
    await this.operarAval(async () => {
      const vecinos = await this.api.buscarVecinosParaAval(consulta);
      this.vecinosAval.set(vecinos);
      if (!vecinos.length) this.avisoAval.set('No se encontraron cuentas sin verificar con esa búsqueda.');
    }, 'No se pudo realizar la búsqueda.');
  }

  async recomendar(vecino: VecinoParaAval): Promise<void> {
    if (vecino.ya_avalado || this.ocupadoAval()) return;
    await this.operarAval(async () => {
      await this.api.recomendarVecino(vecino.id);
      this.vecinosAval.update(lista => lista.map(item => item.id === vecino.id ? { ...item, ya_avalado: true } : item));
      this.avisoAval.set('Aval registrado para ' + vecino.alias + '.');
    }, 'No se pudo registrar el aval.');
  }

  private async operarAval(accion: () => Promise<void>, error: string): Promise<void> {
    this.ocupadoAval.set(true);
    this.avisoAval.set('');
    try {
      await accion();
    } catch {
      this.avisoAval.set(error);
    } finally {
      this.ocupadoAval.set(false);
    }
  }

  async cargarPerfil(): Promise<void> {
    this.perfil.set(null);
    this.error.set(false);
    this.solicitudes.set([]);
    try {
      this.perfil.set(await this.api.getMiPerfil());
      await this.actualizarSolicitudes();
    } catch {
      this.error.set(true);
    }
  }

  async actualizarSolicitudes(): Promise<void> {
    await this.operar(async () => this.solicitudes.set(await this.api.getSolicitudes()));
  }

  async cambiarEstado(id: string, estado: 'ACEPTADA' | 'RECHAZADA' | 'FINALIZADA'): Promise<void> {
    await this.operar(async () => {
      await this.api.cambiarEstadoSolicitud(id, estado);
      this.solicitudes.update(lista => lista.map(s => s.id === id ? { ...s, estado } : s));
    });
  }

  async votar(id: string, seleccion: string): Promise<void> {
    const valor = Number(seleccion);
    if (!this.valores.includes(valor)) {
      this.aviso.set('Elige una calificación de 1 a 5.');
      return;
    }
    await this.operar(async () => {
      await this.api.votarPerfil(id, valor);
      this.solicitudes.update(lista => lista.map(s => s.id === id ? { ...s, perfil_calificado: true } : s));
      this.aviso.set('Calificación guardada.');
    });
  }

  async calificarVecino(id: string, seleccion: string): Promise<void> {
    const valor = Number(seleccion);
    if (!this.valores.includes(valor)) {
      this.aviso.set('Elige una calificación de 1 a 5.');
      return;
    }
    await this.operar(async () => {
      await this.api.calificarVecino(id, valor);
      this.solicitudes.update(lista => lista.map(s => s.id === id ? { ...s, vecino_calificado: true } : s));
      this.aviso.set('Calificación guardada.');
    });
  }

  private async operar(accion: () => Promise<void>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.aviso.set('');
    try {
      await accion();
    } catch {
      this.aviso.set('No se pudo completar la acción. Actualiza las solicitudes y vuelve a intentarlo.');
    } finally {
      this.ocupado.set(false);
    }
  }

  salir(): void {
    this.api.cerrarSesion();
    void this.nav.navigateRoot('/login', { replaceUrl: true });
  }
}
