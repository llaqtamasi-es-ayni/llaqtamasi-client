import { Component, input } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/angular';

/** Tarjeta reutilizable para explicar qué irá en una sección que aún está en construcción. */
@Component({
  selector: 'app-page-placeholder',
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-subtitle>Próximamente</ion-card-subtitle>
        <ion-card-title>{{ titulo() }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <p>{{ descripcion() }}</p>
        @if (pendientes().length) {
          <ul>
            @for (item of pendientes(); track item) {
              <li>{{ item }}</li>
            }
          </ul>
        }
      </ion-card-content>
    </ion-card>
  `,
})
export class PagePlaceholderComponent {
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  /** Lista opcional de funcionalidades previstas. */
  readonly pendientes = input<string[]>([]);
}
