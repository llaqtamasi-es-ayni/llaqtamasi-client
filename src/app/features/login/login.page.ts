import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, NavController } from '@ionic/angular';

import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  imports: [IonContent, FormsModule],
  template: `
    <ion-content>
      <main class="pantalla">
        <section class="tarjeta" aria-labelledby="titulo">
          <p class="marca">Ayni</p>
          <h1 id="titulo">Inicia sesión</h1>
          <p>Accede al mapa y a tu comunidad.</p>
          <form (ngSubmit)="entrar()">
            <label for="usuario">Usuario</label>
            <input id="usuario" name="usuario" [(ngModel)]="usuario" autocomplete="username"
              autocapitalize="none" required />
            <label for="clave">Contraseña</label>
            <input id="clave" name="clave" [(ngModel)]="clave" autocomplete="current-password"
              type="password" required />
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button type="submit" [disabled]="cargando() || !usuario.trim() || !clave">
              {{ cargando() ? 'Conectando…' : 'Iniciar sesión' }}
            </button>
          </form>
        </section>
      </main>
    </ion-content>
  `,
  styles: `
    .pantalla {
      display: grid;
      place-items: center;
      min-height: 100%;
      padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
      background: #f9f0e7;
      color: #261c18;
    }
    .tarjeta {
      width: min(100%, 420px);
      background: #fff;
      border: 1px solid #eadbd1;
      border-radius: 24px;
      padding: 28px;
    }
    .marca { color: #a33220; font-size: 1.35rem; font-weight: 750; margin: 0 0 18px; }
    h1 { font-size: 1.9rem; margin: 0; }
    form { display: grid; gap: 10px; margin-top: 24px; }
    label { font-weight: 600; }
    input, button { min-height: 48px; padding: 10px 14px; border-radius: 12px; font: inherit; }
    input { width: 100%; margin-bottom: 8px; border: 1px solid #ab9388; background: #fff; color: #261c18; }
    button { background: #a33220; color: #fff; font-weight: 700; }
    button:disabled { opacity: .65; }
    .error { color: #9f231b; margin: 0 0 8px; }
  `,
})
export class LoginPage {
  private readonly api = inject(ApiService);
  private readonly nav = inject(NavController);
  readonly cargando = signal(false);
  readonly error = signal('');
  usuario = '';
  clave = '';

  async entrar(): Promise<void> {
    if (this.cargando() || !this.usuario.trim() || !this.clave) return;
    this.cargando.set(true);
    this.error.set('');
    try {
      await this.api.iniciarSesion(this.usuario.trim(), this.clave);
      await this.nav.navigateRoot('/tabs/mapa', { replaceUrl: true });
    } catch {
      this.error.set('No se pudo iniciar sesión. Revisa tus credenciales y que el servidor esté activo.');
    } finally {
      this.clave = '';
      this.cargando.set(false);
    }
  }
}
