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
          <h1 id="titulo">{{ registro ? 'Crea tu cuenta' : 'Inicia sesión' }}</h1>
          <p>Accede al mapa y a tu comunidad.</p>
          <form (ngSubmit)="entrar()">
            @if (registro) {
              <label for="alias">Nombre para mostrar</label>
              <input id="alias" name="alias" [(ngModel)]="alias" autocomplete="nickname" maxlength="150" required />
            }
            <label for="usuario">Usuario</label>
            <input id="usuario" name="usuario" [(ngModel)]="usuario" autocomplete="username"
              autocapitalize="none" maxlength="100" required />
            @if (registro) {
              <small>De 3 a 100 letras sin tildes, números, puntos, guiones o guiones bajos.</small>
            }
            <label for="clave">Contraseña</label>
            <input id="clave" name="clave" [(ngModel)]="clave"
              [attr.autocomplete]="registro ? 'new-password' : 'current-password'"
              type="password" maxlength="72" required />
            @if (registro) {
              <small>Usa al menos 12 caracteres.</small>
              <label for="confirmacion">Repite la contraseña</label>
              <input id="confirmacion" name="confirmacion" [(ngModel)]="confirmacion"
                autocomplete="new-password" type="password" maxlength="72" required />
            }
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button type="submit" [disabled]="cargando() || !usuario.trim() || !clave">
              {{ cargando() ? 'Conectando…' : registro ? 'Crear cuenta' : 'Iniciar sesión' }}
            </button>
          </form>
          <button type="button" class="alternar" [disabled]="cargando()" (click)="alternarFormulario()">
            {{ registro ? 'Volver a iniciar sesión' : 'Crear una cuenta' }}
          </button>
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
    .alternar { margin-top: 12px; background: transparent; color: #a33220; text-decoration: underline; }
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
  registro = false;
  alias = '';
  confirmacion = '';

  alternarFormulario(): void {
    this.registro = !this.registro;
    this.clave = '';
    this.confirmacion = '';
    this.error.set('');
  }

  async entrar(): Promise<void> {
    if (this.cargando() || !this.usuario.trim() || !this.clave) return;
    const usuario = this.usuario.trim();
    if (this.registro) {
      if (!this.alias.trim() || !/^[A-Za-z0-9_.-]{3,100}$/.test(usuario)) {
        this.error.set('Revisa el nombre para mostrar y el formato del usuario.');
        return;
      }
      if (!this.clave.trim() || this.clave.length < 12 || new TextEncoder().encode(this.clave).length > 72) {
        this.error.set('La contraseña debe tener al menos 12 caracteres y ocupar hasta 72 bytes.');
        return;
      }
      if (this.clave !== this.confirmacion) {
        this.error.set('Las contraseñas no coinciden.');
        return;
      }
    }
    this.cargando.set(true);
    this.error.set('');
    try {
      if (this.registro) await this.api.registrar(this.alias.trim(), usuario, this.clave);
      else await this.api.iniciarSesion(usuario, this.clave);
      await this.nav.navigateRoot('/tabs/mapa', { replaceUrl: true });
    } catch (error: unknown) {
      const status = typeof error === 'object' && error !== null && 'status' in error
        ? error.status
        : undefined;
      if (this.registro) {
        this.error.set(status === 409
          ? 'Ese nombre de usuario ya está ocupado.'
          : 'No se pudo crear la cuenta. Revisa los datos y la conexión con la API.');
      } else this.error.set(status === 401
        ? 'El usuario o la contraseña son incorrectos.'
        : 'No se pudo iniciar sesión. Comprueba que la API esté activa en el puerto 18080.');
    } finally {
      this.clave = '';
      this.confirmacion = '';
      this.cargando.set(false);
    }
  }
}
