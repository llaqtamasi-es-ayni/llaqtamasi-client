import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AccionPendiente, Centro, Perfil, PublicacionMuro, Reporte } from '../models';

/**
 * Acceso al backend (Spring Boot).
 *
 * Por ahora, con `environment.usarMocks = true`, las lecturas salen de src/assets/mock/*.json.
 * Las ESCRITURAS no se llaman desde las páginas: van siempre por OfflineQueueService,
 * que a su vez llama a `enviarAccion`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCentros(): Observable<Centro[]> {
    return this.get<Centro[]>('centros', 'centros.json');
  }

  getPerfiles(): Observable<Perfil[]> {
    return this.get<Perfil[]>('perfiles', 'perfiles.json');
  }

  getPublicacionesMuro(): Observable<PublicacionMuro[]> {
    return this.get<PublicacionMuro[]>('muro', 'muro.json');
  }

  /** Reportes vigentes: los caducados se descartan también en el cliente. */
  getReportes(): Observable<Reporte[]> {
    return this.get<Reporte[]>('reportes', 'reportes.json').pipe(
      map((reportes) => reportes.filter((r) => new Date(r.expiraEn).getTime() > Date.now())),
    );
  }

  /**
   * Envía al backend una acción de la cola offline. Solo debe llamarla OfflineQueueService.
   * El backend debe usar `accion.uuid` como clave de idempotencia.
   */
  async enviarAccion(accion: AccionPendiente): Promise<void> {
    if (environment.usarMocks) {
      console.info('[ApiService] (mock) acción enviada', accion.tipo, accion.uuid);
      return;
    }
    await firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/acciones`, accion, {
        headers: { 'Idempotency-Key': accion.uuid },
      }),
    );
  }

  private get<T>(endpoint: string, archivoMock: string): Observable<T> {
    const url = environment.usarMocks ? `assets/mock/${archivoMock}` : `${this.baseUrl}/${endpoint}`;
    return this.http.get<T>(url);
  }
}
