import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import { PagePlaceholderComponent } from '../../shared';

@Component({
  selector: 'app-reportes',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, PagePlaceholderComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Reportes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-page-placeholder
        titulo="Reportes en tiempo real"
        descripcion="Reportes tipo Waze: cortes de agua o luz, vías bloqueadas, accidentes. Caducan solos y nunca se refieren a personas."
        [pendientes]="[
          'Lista y mapa de reportes vigentes (ApiService.getReportes)',
          'Confirmar / desmentir un reporte',
          'Crear reporte: tipo → ubicación bajo demanda → enviar (vía OfflineQueueService)',
        ]"
      />
    </ion-content>
  `,
})
export class ReportesPage {}
