import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const CLAVE_ALMACEN = 'ayni.modo-emergencia';
/** Clase en <html> que activa el tema de emergencia (ver src/theme/variables.scss). */
const CLASE_EMERGENCIA = 'modo-emergencia';
const COLOR_BARRA_NORMAL = '#176354';
const COLOR_BARRA_EMERGENCIA = '#000000';

/**
 * Modo emergencia de toda la app, como un modo oscuro: una vez activado se mantiene en
 * todas las pantallas y al volver a abrir la app, hasta que el usuario lo desactive.
 */
@Injectable({ providedIn: 'root' })
export class ModoEmergenciaService {
  private readonly document = inject(DOCUMENT);
  private readonly estado = signal(this.leer());
  readonly activo = this.estado.asReadonly();

  constructor() {
    this.aplicar(this.estado());
  }

  cambiar(activo: boolean): void {
    this.estado.set(activo);
    this.aplicar(activo);
    this.guardar(activo);
  }

  private aplicar(activo: boolean): void {
    this.document.documentElement.classList.toggle(CLASE_EMERGENCIA, activo);
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', activo ? COLOR_BARRA_EMERGENCIA : COLOR_BARRA_NORMAL);
  }

  // El almacenamiento puede estar bloqueado: el modo sigue funcionando, solo que no se recuerda.
  private leer(): boolean {
    try {
      return this.document.defaultView?.localStorage.getItem(CLAVE_ALMACEN) === 'true';
    } catch {
      return false;
    }
  }

  private guardar(activo: boolean): void {
    try {
      this.document.defaultView?.localStorage.setItem(CLAVE_ALMACEN, String(activo));
    } catch {
      // Sin almacenamiento disponible no hay nada más que hacer.
    }
  }
}
