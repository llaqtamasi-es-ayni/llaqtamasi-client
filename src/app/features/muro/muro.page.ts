import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import { PagePlaceholderComponent } from '../../shared';

@Component({
  selector: 'app-muro',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, PagePlaceholderComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Muro de favores</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-page-placeholder
        titulo="Ofrezco / Necesito"
        descripcion="Aquí los vecinos publican favores que ofrecen o que necesitan, filtrados por categoría."
        [pendientes]="[
          'Lista de publicaciones (ApiService.getPublicacionesMuro)',
          'Botón para publicar en máximo 3 toques: tipo → categoría → texto',
          'Publicar siempre vía OfflineQueueService (CREAR_PUBLICACION_MURO)',
        ]"
      />
    </ion-content>
  `,
})
export class MuroPage {}
