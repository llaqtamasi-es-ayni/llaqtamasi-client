import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, type ViewWillEnter, type ViewWillLeave } from '@ionic/angular';

import { NetworkService, OfflineQueueService } from '../../core';
import { PagePlaceholderComponent } from '../../shared';

/** Clases en <html> que activan el tema de emergencia (ver src/theme/variables.scss). */
const CLASES_EMERGENCIA = ['ion-palette-dark', 'modo-emergencia'];

@Component({
  selector: 'app-emergencia',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, PagePlaceholderComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Emergencia</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="estado">
        Conexión: <strong>{{ network.online() ? 'en línea' : 'SIN INTERNET' }}</strong> · Acciones pendientes de enviar:
        <strong>{{ cola.pendientes() }}</strong>
      </p>
      <app-page-placeholder
        titulo="Modo emergencia"
        descripcion="Funciona sin internet y ahorra batería: fondo negro (pantallas OLED), sin animaciones y GPS solo bajo demanda."
        [pendientes]="[
          'Centros de ayuda cercanos guardados para uso offline',
          'Reportar emergencia en máximo 3 toques (queda en cola si no hay red)',
          'Mapa offline de la zona',
        ]"
      />
    </ion-content>
  `,
  styles: `
    .estado {
      font-size: 0.95rem;
    }
  `,
})
export class EmergenciaPage implements ViewWillEnter, ViewWillLeave {
  protected readonly network = inject(NetworkService);
  protected readonly cola = inject(OfflineQueueService);
  private readonly document = inject(DOCUMENT);

  ionViewWillEnter(): void {
    this.document.documentElement.classList.add(...CLASES_EMERGENCIA);
  }

  ionViewWillLeave(): void {
    this.document.documentElement.classList.remove(...CLASES_EMERGENCIA);
  }
}
