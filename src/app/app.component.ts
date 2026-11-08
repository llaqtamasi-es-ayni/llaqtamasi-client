import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { ModoEmergenciaService } from './core/services/modo-emergencia.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Se crea al arrancar para restaurar el modo emergencia desde la primera pantalla.
    inject(ModoEmergenciaService);
  }
}
