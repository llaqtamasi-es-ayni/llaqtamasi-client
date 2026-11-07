import { Injectable, inject, signal } from '@angular/core';
import Dexie, { type Table } from 'dexie';

import type { AccionPendiente, TipoAccion } from '../models';
import { generarUuid } from '../utils/uuid';

import { ApiService } from './api.service';
import { NetworkService } from './network.service';

class AyniDb extends Dexie {
  acciones!: Table<AccionPendiente, string>;

  constructor() {
    super('ayni');
    this.version(1).stores({ acciones: 'uuid, creadoEn, tipo' });
  }
}

const ESPERA_BASE_MS = 2_000;
const ESPERA_MAX_MS = 5 * 60_000;

/**
 * Cola offline: TODA acción de escritura pasa por aquí.
 *
 *  1. `encolar()` guarda la acción en IndexedDB (Dexie) con un UUID generado en el cliente.
 *  2. Si hay conexión, intenta enviarla de inmediato.
 *  3. Si falla o no hay red, queda guardada y se reintenta cuando NetworkService
 *     avisa que volvió la conexión, con espera creciente (2s, 4s, 8s... hasta 5 min).
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly api = inject(ApiService);
  private readonly network = inject(NetworkService);
  private readonly db = new AyniDb();

  private procesando = false;
  private intentoActual = 0;
  private temporizador?: ReturnType<typeof setTimeout>;

  /** Número de acciones pendientes de enviar (para mostrar en la UI). */
  readonly pendientes = signal(0);

  constructor() {
    this.network.online$.subscribe((online) => {
      if (online) {
        this.intentoActual = 0;
        void this.procesar();
      } else {
        this.cancelarReintento();
      }
    });
    void this.actualizarContador();
  }

  /** Guarda una acción de escritura y devuelve su UUID. */
  async encolar(tipo: TipoAccion, payload: unknown): Promise<string> {
    const accion: AccionPendiente = {
      uuid: generarUuid(),
      tipo,
      payload,
      creadoEn: new Date().toISOString(),
      intentos: 0,
    };
    await this.db.acciones.add(accion);
    await this.actualizarContador();
    if (this.network.estaOnline) {
      void this.procesar();
    }
    return accion.uuid;
  }

  /** Envía las acciones pendientes en orden de creación. */
  async procesar(): Promise<void> {
    if (this.procesando || !this.network.estaOnline) return;
    this.procesando = true;
    this.cancelarReintento();
    try {
      const acciones = await this.db.acciones.orderBy('creadoEn').toArray();
      for (const accion of acciones) {
        try {
          await this.api.enviarAccion(accion);
          await this.db.acciones.delete(accion.uuid);
        } catch (error) {
          console.warn('[OfflineQueue] fallo al enviar', accion.uuid, error);
          await this.db.acciones.update(accion.uuid, { intentos: (accion.intentos ?? 0) + 1 });
          this.programarReintento();
          return; // se respeta el orden: no seguimos con las siguientes
        }
      }
      this.intentoActual = 0;
    } finally {
      this.procesando = false;
      await this.actualizarContador();
    }
  }

  private programarReintento(): void {
    const espera = Math.min(ESPERA_BASE_MS * 2 ** this.intentoActual, ESPERA_MAX_MS);
    const jitter = Math.random() * 0.3 * espera; // evita que todos reintenten a la vez
    this.intentoActual++;
    this.temporizador = setTimeout(() => void this.procesar(), espera + jitter);
  }

  private cancelarReintento(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
  }

  private async actualizarContador(): Promise<void> {
    this.pendientes.set(await this.db.acciones.count());
  }
}
