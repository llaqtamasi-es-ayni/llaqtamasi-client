import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, NavController } from '@ionic/angular';

import { ApiService } from '../../core/services/api.service';
import { PagePlaceholderComponent } from '../../shared';

@Component({
  selector: 'app-perfil',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, PagePlaceholderComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-page-placeholder
        titulo="Mi perfil"
        descripcion="Alias del vecino, verificación y nivel de confianza. Si es proveedor: su servicio, tienda o apoyo y sus zonas de atención."
        [pendientes]="[
          'Datos del usuario (alias, verificado, nivelConfianza)',
          'Editar perfil de proveedor: categoría, descripción, zonas de atención (polígonos)',
          'Mis solicitudes y chat con proveedores',
          'Nunca pedir ni mostrar dirección, coordenadas de casa ni teléfono',
        ]"
      />
      <ion-button (click)="salir()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class PerfilPage {
  private readonly api = inject(ApiService);
  private readonly nav = inject(NavController);

  salir(): void {
    this.api.cerrarSesion();
    void this.nav.navigateRoot('/login', { replaceUrl: true });
  }
}
