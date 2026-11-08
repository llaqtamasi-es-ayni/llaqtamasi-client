import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { ApiService, generarUuid, type ChatMuro, type MensajeMuro } from '../../core';

@Component({
  selector: 'app-aviso-muro',
  imports: [FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header><ion-toolbar><ion-title>Aviso del Muro</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <a routerLink="/tabs/muro">← Volver al Muro</a>
      @if (detalle(); as aviso) {
        <h1>{{ aviso.tipo === 'OFREZCO' ? 'Ofrezco' : 'Necesito' }} · {{ aviso.categoria }}</h1>
        <p>{{ aviso.texto }}</p>
        <p>Publicado por <strong>{{ aviso.alias }}</strong> · {{ estado(aviso.verificado) }}</p>
        @if (usuarioId() === aviso.autor_id && !puedeEscribir()) {
          <h2>Respuestas a este aviso</h2>
          <button type="button" (click)="actualizarRespuestas()" [disabled]="ocupado()">Actualizar respuestas</button>
          @for (chat of respuestas(); track chat.interesado_id) {
            <p>
              <a [routerLink]="['/tabs/muro/aviso', chat.publicacion_id, chat.interesado_id]">{{ chat.alias }}</a>
              · {{ estado(chat.verificado) }}
            </p>
          } @empty {
            @if (!ocupado() && !error()) { <p>Todavía no hay respuestas.</p> }
          }
        } @else if (puedeEscribir()) {
          <h2>Conversación privada</h2>
          @if (usuarioId() === aviso.autor_id) {
            <a [routerLink]="['/tabs/muro/aviso', publicacion, usuarioId()]">← Respuestas de este aviso</a>
            <p><strong>{{ aviso.interesado_alias }}</strong> · {{ estado(aviso.interesado_verificado) }}</p>
          }
          <button type="button" (click)="cargarMensajes()" [disabled]="ocupado()">Actualizar mensajes</button>
          @for (mensaje of mensajes(); track mensaje.id) {
            <p><strong>{{ mensaje.autor_id === usuarioId() ? 'Tú' :
              usuarioId() === aviso.autor_id ? aviso.interesado_alias : aviso.alias }}</strong> · {{ mensaje.texto }}</p>
          }
          <form (ngSubmit)="enviar()">
            <label for="mensaje">Mensaje</label>
            <textarea id="mensaje" name="mensaje" [(ngModel)]="borrador" maxlength="2000" [disabled]="ocupado()"></textarea>
            <button type="submit" [disabled]="ocupado() || !borrador.trim()">Enviar mensaje</button>
          </form>
        }
      }
      @if (ocupado()) { <p role="status">Procesando…</p> }
      @if (error()) { <p role="alert">{{ error() }}</p> }
    </ion-content>
  `,
  styles: `
    p { white-space: pre-wrap; overflow-wrap: anywhere; }
    form { display: grid; gap: 8px; margin-top: 16px; }
    textarea, button { padding: 10px; border: 1px solid var(--ion-color-medium); border-radius: 6px; }
    button { background: var(--ion-color-primary); color: var(--ion-color-primary-contrast); }
    button:disabled { opacity: .55; }
  `,
})
export class AvisoMuroPage {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);
  get publicacion(): string { return this.ruta.snapshot.paramMap.get('publicacion') ?? ''; }
  private get interesado(): string { return this.ruta.snapshot.paramMap.get('interesado') ?? ''; }
  readonly detalle = signal<Awaited<ReturnType<ApiService['getDetalleAviso']>> | null>(null);
  readonly usuarioId = signal('');
  readonly mensajes = signal<MensajeMuro[]>([]);
  readonly respuestas = signal<ChatMuro[]>([]);
  readonly ocupado = signal(false);
  readonly error = signal('');
  borrador = '';
  private pendiente?: { id: string; texto: string };

  ionViewWillEnter(): void {
    this.detalle.set(null);
    this.mensajes.set([]);
    this.respuestas.set([]);
    this.borrador = '';
    this.pendiente = undefined;
    void this.operar(async () => {
      const perfil = await this.api.getMiPerfil();
      this.usuarioId.set(perfil.id);
      this.detalle.set(await this.api.getDetalleAviso(this.publicacion, this.interesado));
      if (this.puedeEscribir()) await this.leerMensajes();
      else await this.leerRespuestas();
    }, 'No se pudo cargar el aviso o la conversación.');
  }

  async actualizarRespuestas(): Promise<void> {
    await this.operar(() => this.leerRespuestas(), 'No se pudieron cargar las respuestas.');
  }

  private async leerRespuestas(): Promise<void> {
    const chats = await this.api.getChatsMuro();
    this.respuestas.set(chats.filter(chat => chat.publicacion_id === this.publicacion));
  }

  estado(verificado: boolean | number): string {
    return verificado === true || verificado === 1 ? 'Cuenta verificada' : 'Cuenta sin verificar';
  }

  puedeEscribir(): boolean {
    const aviso = this.detalle();
    return aviso !== null && aviso.autor_id !== this.interesado;
  }

  async cargarMensajes(): Promise<void> {
    await this.operar(() => this.leerMensajes(), 'No se pudieron cargar los mensajes.');
  }

  async enviar(): Promise<void> {
    const texto = this.borrador.trim();
    if (!texto || !this.puedeEscribir() || this.ocupado()) return;
    const id = this.pendiente?.texto === texto ? this.pendiente.id : generarUuid();
    this.pendiente = { id, texto };
    await this.operar(async () => {
      await this.api.enviarMensajeMuro(this.publicacion, this.interesado, id, texto);
      this.pendiente = undefined;
      this.borrador = '';
    }, 'No se pudo confirmar el envío. Puedes reintentar.');
    if (!this.error()) await this.cargarMensajes();
  }

  private async leerMensajes(): Promise<void> {
    this.mensajes.set(await this.api.getMensajesMuro(this.publicacion, this.interesado));
  }

  private async operar(accion: () => Promise<void>, mensaje: string): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
    } catch {
      this.error.set(mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
