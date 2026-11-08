import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { firstValueFrom, from, map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AccionPendiente, Centro, Perfil, PublicacionMuro, Reporte } from '../models';

export interface SolicitudApi {
  id: string;
  vecino_id: string;
  perfil_id: string;
  mensaje_inicial: string;
  estado: string;
  perfil_calificado: boolean | number;
  vecino_calificado: boolean | number;
}

export interface VecinoParaAval {
  id: string;
  alias: string;
  nombre_acceso: string;
  ya_avalado: boolean | number;
}

export interface ZonaDisponible {
  id: string;
  nombre: string;
  limite_wkt?: string;
}

export interface ChatMuro {
  publicacion_id: string;
  interesado_id: string;
  categoria: string;
  alias: string;
  verificado: boolean | number;
}

export interface MensajeMuro {
  id: string;
  autor_id: string;
  texto: string;
}

type CentroApi = Omit<Centro, 'ubicacion' | 'horario'> & {
  lat: number;
  lng: number;
  horario: string | null;
  contacto_publico: string | null;
};

type ReporteApi = Omit<Reporte, 'ubicacion' | 'creadoEn' | 'expiraEn'> & {
  autor_id: string;
  lat: number | null;
  lng: number | null;
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
    await this.autenticar('auth/login', { nombreAcceso, password });
  }

  async registrar(alias: string, nombreAcceso: string, password: string): Promise<void> {
    await this.autenticar('auth/registro', { alias, nombreAcceso, password });
  }

  getMiPerfil(): Promise<{ id: string; alias: string; verificado: boolean | number }> {
    return this.request('GET', 'usuarios/me');
  }

  buscarVecinosParaAval(consulta: string): Promise<VecinoParaAval[]> {
    return this.request('GET', 'usuarios/para-avalar', undefined, { q: consulta });
  }

  async recomendarVecino(id: string): Promise<void> {
    await this.request('POST', 'usuarios/' + id + '/avales');
  }

  private async autenticar(ruta: string, datos: object): Promise<void> {
    const session = await this.request<{ accessToken: string; expiresIn: number }>('POST', ruta, datos);
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
      map((centros) => centros.map(({ id, nombre, tipo, lat, lng, horario, contacto_publico }) => ({
        id, nombre, tipo, ubicacion: { lat, lng }, horario: horario ?? '', contactoPublico: contacto_publico,
      }))),
    );
  }

  getPerfilesDeZona(zonaId: string): Observable<Array<{
    id: string; usuarioId: string; alias: string; tipo: Perfil['tipo']; descripcion: string; confianza: number;
    categoriaId?: string; votos: number; nombre_establecimiento?: string | null;
  }>> {
    if (this.usaMocks) {
      return this.mock<Perfil[]>('perfiles.json').pipe(
        map(perfiles => perfiles.map(perfil => ({ ...perfil, alias: perfil.categoria, votos: 0 }))),
      );
    }
    return from(this.request<Array<{
      id: string; usuario_id: string; categoria_id: string; alias: string;
      tipo: Perfil['tipo']; descripcion: string; confianza: number; votos: number; nombre_establecimiento?: string | null;
    }>>('GET', 'zonas/' + zonaId + '/perfiles')).pipe(
      map((perfiles) => perfiles.map(({ usuario_id, categoria_id, ...perfil }) => ({
        ...perfil, usuarioId: usuario_id, categoriaId: categoria_id,
      }))),
    );
  }

  async categoriasDeTrabajo(): Promise<Array<{ id: string; nombre: string }>> {
    const rows = await this.request<Array<{ id: string; nombre: string; activa: boolean | number }>>('GET', 'catalogos/categorias');
    return rows.filter(row => row.activa === true || row.activa === 1);
  }

  async publicarServicio(id: string, categoriaId: string, descripcion: string, areaWkt: string, nombreEstablecimiento?: string): Promise<void> {
    await this.request('POST', 'perfiles', {
      id, categoriaId, tipo: nombreEstablecimiento ? 'TIENDA' : 'SERVICIO', descripcion, areaWkt, nombreEstablecimiento,
    });
  }

  getPublicacionesMuro(zonaId: string): Observable<PublicacionMuro[]> {
    return this.usaMocks
      ? this.mock<PublicacionMuro[]>('muro.json')
      : from(this.request<Array<PublicacionMuro & { autor_id: string; expira_en: string | null }>>('GET', 'muro', undefined, { zonaId }))
        .pipe(map(rows => rows.map(({ autor_id, expira_en, ...aviso }) => ({
          ...aviso, autorId: autor_id, expiraEn: expira_en ? this.fechaUtc(expira_en) : null,
        }))));
  }

  getSolicitudes(): Promise<SolicitudApi[]> {
    return this.request('GET', 'solicitudes');
  }

  async crearSolicitud(id: string, perfilId: string, mensaje: string): Promise<void> {
    await this.request('POST', 'solicitudes', { id, perfilId, mensaje });
  }

  async cambiarEstadoSolicitud(id: string, estado: 'ACEPTADA' | 'RECHAZADA' | 'FINALIZADA'): Promise<void> {
    await this.request('PATCH', 'solicitudes/' + id, { estado });
  }

  async votarPerfil(solicitudId: string, valor: number): Promise<void> {
    await this.request('PUT', 'solicitudes/' + solicitudId + '/voto', { valor });
  }

  getChatsMuro(): Promise<ChatMuro[]> {
    return this.request('GET', 'muro/chats');
  }

  getMensajesMuro(publicacionId: string, interesadoId: string): Promise<MensajeMuro[]> {
    return this.request('GET', 'muro/chats/' + publicacionId + '/' + interesadoId);
  }

  getDetalleAviso(publicacionId: string, interesadoId: string): Promise<{
    autor_id: string; tipo: string; categoria: string; texto: string; alias: string;
    verificado: boolean | number; interesado_alias: string; interesado_verificado: boolean | number;
  }> {
    return this.request('GET', 'muro/chats/' + publicacionId + '/' + interesadoId + '/detalle');
  }

  async enviarMensajeMuro(publicacionId: string, interesadoId: string, id: string, texto: string): Promise<void> {
    await this.request('POST', 'muro/chats/' + publicacionId + '/' + interesadoId, { id, texto });
  }

  getReportes(zonaId: string): Observable<Reporte[]> {
    const reportes = this.usaMocks
      ? this.mock<Reporte[]>('reportes.json')
      : from(this.request<ReporteApi[]>('GET', 'reportes', undefined, { zonaId })).pipe(
        map((rows) => rows.map(({ lat, lng, creado_en, expira_en, autor_id, ...r }) => ({
          ...r, autorId: autor_id, ubicacion: lat === null || lng === null ? null : { lat, lng },
          creadoEn: this.fechaUtc(creado_en), expiraEn: this.fechaUtc(expira_en),
        }))),
      );
    return reportes.pipe(map((rows) => rows.filter((r) => Date.parse(r.expiraEn) > Date.now())));
  }

  async publicarMuro(datos: { id: string; zonaId: string; tipo: PublicacionMuro['tipo']; categoria: string; texto: string; duracionHoras: number }): Promise<void> {
    await this.request('POST', 'muro', datos);
  }

  async retirarAviso(id: string): Promise<void> {
    await this.request('PATCH', 'muro/' + id + '/cerrar');
  }

  async calificarVecino(id: string, valor: number): Promise<void> {
    await this.request('PUT', 'solicitudes/' + id + '/calificacion-vecino', { valor });
  }

  async publicarReporte(datos: {
    id: string; tipo: string; texto: string; lat: number | null; lng: number | null;
    direccion: string; zonaId: string; duracionHoras: number;
  }): Promise<void> {
    await this.request('POST', 'reportes', datos);
  }

  async responderReporte(id: string, decision: 'CONFIRMA' | 'DESMIENTE'): Promise<void> {
    await this.request('PUT', 'reportes/' + id + '/respuesta', { decision });
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
          direccion: payload['direccion'], zonaId: payload['zonaId'],
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
          duracionHoras: payload['duracionHoras'],
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

  private async request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', path: string, data?: object, params?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (path !== 'auth/login' && this.tieneSesion()) headers['Authorization'] = 'Bearer ' + this.token();
    const url = this.baseUrl + '/' + path;
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        method, url, headers, data, params, connectTimeout: 8000, readTimeout: 10000,
      });
      if (response.status >= 400) {
        throw Object.assign(new Error('El servidor respondió con HTTP ' + response.status), {
          status: response.status,
        });
      }
      return response.data as T;
    }
    return firstValueFrom(this.http.request<T>(method, url, { headers, body: data, params }));
  }
}

