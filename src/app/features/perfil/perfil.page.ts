import { Component, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, NavController } from '@ionic/angular';

import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-perfil',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
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
  readonly perfil = signal<{ alias: string; verificado: boolean | number } | null>(null);
  readonly error = signal(false);

  ionViewWillEnter(): void {
    void this.cargarPerfil();
  }

  async cargarPerfil(): Promise<void> {
    this.perfil.set(null);
    this.error.set(false);
    try {
      this.perfil.set(await this.api.getMiPerfil());
    } catch {
      this.error.set(true);
    }
  }

  salir(): void {
    this.api.cerrarSesion();
    void this.nav.navigateRoot('/login', { replaceUrl: true });
  }
}
