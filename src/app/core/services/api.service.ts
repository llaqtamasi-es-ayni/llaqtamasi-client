import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { firstValueFrom, from, map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AccionPendiente, Centro, Perfil, PublicacionMuro, Reporte } from '../models';

export interface ZonaDisponible {
  id: string;
  nombre: string;
}

type CentroApi = Omit<Centro, 'ubicacion' | 'horario'> & {
  lat: number;
  lng: number;
  horario: string | null;
};

type ReporteApi = Omit<Reporte, 'ubicacion' | 'creadoEn' | 'expiraEn'> & {
  lat: number;
  lng: number;
  creado_en: string;
  expira_en: string;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly token = signal<string | null>(null);
  private expiraEn = 0;
  private readonly baseUrl = !environment.production && Capacitor.getPlatform() === 'android'
    ? environment.apiUrl.replace('localhost', '10.0.2.2')
    : environment.apiUrl;
  readonly usaMocks = environment.usarMocks;

  tieneSesion(): boolean {
    return this.token() !== null && Date.now() < this.expiraEn;
  }

  async iniciarSesion(nombreAcceso: string, password: string): Promise<void> {
    const session = await this.request<{ accessToken: string; expiresIn: number }>('POST', 'auth/login', {
      nombreAcceso,
      password,
    });
    this.expiraEn = Date.now() + session.expiresIn * 1000;
    this.token.set(session.accessToken);
  }

  cerrarSesion(): void {
    this.token.set(null);
  }

  getZonas(): Promise<ZonaDisponible[]> {
    return this.request<ZonaDisponible[]>('GET', 'zonas');
  }

  getCentros(zonaId?: string): Observable<Centro[]> {
    if (this.usaMocks) return this.mock<Centro[]>('centros.json');
    return from(this.request<CentroApi[]>('GET', 'centros', undefined, { zonaId: zonaId ?? '' })).pipe(
      map((centros) => centros.map(({ id, nombre, tipo, lat, lng, horario }) => ({
        id, nombre, tipo, ubicacion: { lat, lng }, horario: horario ?? '',
      }))),
    );
  }

  getPerfiles(lat: number, lng: number) {
    if (this.usaMocks) return this.mock<Perfil[]>('perfiles.json');
    return from(this.request<Array<{
      id: string; usuario_id: string; categoria_id: string; alias: string;
      tipo: Perfil['tipo']; descripcion: string; confianza: number;
    }>>('GET', 'perfiles', undefined, { lat: String(lat), lng: String(lng) })).pipe(
      map((perfiles) => perfiles.map(({ usuario_id, categoria_id, ...perfil }) => ({
        ...perfil, usuarioId: usuario_id, categoriaId: categoria_id,
      }))),
    );
  }

  getPublicacionesMuro(zonaId: string): Observable<PublicacionMuro[]> {
    return this.usaMocks
      ? this.mock<PublicacionMuro[]>('muro.json')
      : from(this.request<PublicacionMuro[]>('GET', 'muro', undefined, { zonaId }));
  }

  getReportes(zonaId: string): Observable<Reporte[]> {
    const reportes = this.usaMocks
      ? this.mock<Reporte[]>('reportes.json')
      : from(this.request<ReporteApi[]>('GET', 'reportes', undefined, { zonaId })).pipe(
        map((rows) => rows.map(({ lat, lng, creado_en, expira_en, ...r }) => ({
          ...r, ubicacion: { lat, lng },
          creadoEn: this.fechaUtc(creado_en), expiraEn: this.fechaUtc(expira_en),
        }))),
      );
    return reportes.pipe(map((rows) => rows.filter((r) => Date.parse(r.expiraEn) > Date.now())));
  }

  async enviarAccion(accion: AccionPendiente): Promise<void> {
    if (this.usaMocks) return;
    const payload = accion.payload as Record<string, unknown>;
    const idAccion = accion.uuid;
    const id = payload['id'] ?? idAccion;
    let entrada: object;
    switch (accion.tipo) {
      case 'CREAR_REPORTE': {
        const punto = payload['ubicacion'] as { lat: number; lng: number } | undefined;
        entrada = { tipo: 'REPORTE', reporte: {
          id, tipo: payload['tipo'], texto: payload['texto'],
          lat: punto?.lat ?? payload['lat'], lng: punto?.lng ?? payload['lng'],
          duracionHoras: payload['duracionHoras'],
        } };
        break;
      }
      case 'CONFIRMAR_REPORTE':
      case 'DESMENTIR_REPORTE':
        entrada = { tipo: 'RESPUESTA', destinoId: payload['reporteId'], respuesta: {
          decision: accion.tipo === 'CONFIRMAR_REPORTE' ? 'CONFIRMA' : 'DESMIENTE',
        } };
        break;
      case 'CREAR_PUBLICACION_MURO':
        entrada = { tipo: 'MURO', muro: {
          id, zonaId: payload['zonaId'], tipo: payload['tipo'],
          categoria: payload['categoria'], texto: payload['texto'],
        } };
        break;
      case 'CREAR_SOLICITUD':
        entrada = { tipo: 'SOLICITUD', solicitud: { id, perfilId: payload['perfilId'], mensaje: payload['mensaje'] } };
        break;
      case 'ENVIAR_MENSAJE':
        entrada = { tipo: 'MENSAJE', destinoId: payload['solicitudId'], mensaje: { id, texto: payload['texto'] } };
        break;
      case 'VOTAR_PERFIL':
        entrada = { tipo: 'VOTO', destinoId: payload['perfilId'], voto: { valor: payload['valor'] } };
        break;
    }
    const [resultado] = await this.request<Array<{ estado: string; error?: string }>>('POST', 'sync', {
      acciones: [{ idAccion, ...entrada }],
    });
    if (!resultado || !['APLICADA', 'YA_APLICADA'].includes(resultado.estado)) {
      throw new Error(resultado?.error ?? 'La acción no se pudo sincronizar.');
    }
  }

  private fechaUtc(fecha: string): string {
    return /(?:Z|[+-]\d{2}:\d{2})$/.test(fecha) ? fecha : fecha + 'Z';
  }

  private mock<T>(archivo: string): Observable<T> {
    return this.http.get<T>('assets/mock/' + archivo);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, data?: object, params?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (path !== 'auth/login' && this.tieneSesion()) headers['Authorization'] = 'Bearer ' + this.token();
    const url = this.baseUrl + '/' + path;
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        method, url, headers, data, params, connectTimeout: 8000, readTimeout: 10000,
      });
      if (response.status >= 400) throw new Error('El servidor respondió con HTTP ' + response.status);
      return response.data as T;
    }
    return firstValueFrom(this.http.request<T>(method, url, { headers, body: data, params }));
  }
}

