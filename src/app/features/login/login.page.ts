import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, NavController } from '@ionic/angular';

import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  imports: [IonContent, FormsModule],
  template: `
    <ion-content>
      <main class="pantalla ayni-pagina">
        <section class="tarjeta ayni-tarjeta" aria-labelledby="titulo">
          <div class="marca">
            <span aria-hidden="true">A</span>
            <div><strong>Ayni</strong><small>Red vecinal de Arequipa</small></div>
          </div>
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
          <button type="button" class="alternar ayni-secundario" [disabled]="cargando()" (click)="alternarFormulario()">
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
      width: 100%;
      min-height: 100%;
      padding-block: max(24px, var(--ion-safe-area-top, 0px)) max(24px, var(--ion-safe-area-bottom, 0px));
      background: radial-gradient(ellipse at top, #dceae2, transparent 66%), var(--ion-background-color);
    }
    .tarjeta {
      width: min(100%, 28rem);
      border-radius: 24px;
      padding: clamp(16px, 5vw, 32px);
    }
    .marca { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .marca span {
      display: grid;
      place-items: center;
      flex: 0 0 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      font-size: 1.45rem;
      font-weight: 800;
    }
    .marca strong, .marca small { display: block; }
    .marca strong { color: var(--ayni-accent); font-size: 1.25rem; }
    form { margin-top: 20px; }
    .tarjeta button { width: 100%; }
    .alternar { margin-top: 10px; }
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
        : 'No se pudo iniciar sesión. Comprueba que la API esté activa.');
    } finally {
      this.clave = '';
      this.confirmacion = '';
      this.cargando.set(false);
    }
  }
}
