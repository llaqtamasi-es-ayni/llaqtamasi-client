import { TestBed } from '@angular/core/testing';

import { ModoEmergenciaService } from './modo-emergencia.service';

describe('ModoEmergenciaService', () => {
  const clases = () => document.documentElement.classList;

  beforeEach(() => {
    localStorage.clear();
    clases().remove('modo-emergencia');
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.clear();
    clases().remove('modo-emergencia');
  });

  it('empieza desactivado', () => {
    const modo = TestBed.inject(ModoEmergenciaService);
    expect(modo.activo()).toBe(false);
    expect(clases().contains('modo-emergencia')).toBe(false);
  });

  it('aplica y quita el tema en toda la página', () => {
    const modo = TestBed.inject(ModoEmergenciaService);
    modo.cambiar(true);
    expect(modo.activo()).toBe(true);
    expect(clases().contains('modo-emergencia')).toBe(true);
    modo.cambiar(false);
    expect(clases().contains('modo-emergencia')).toBe(false);
  });

  it('se recuerda al volver a abrir la app', () => {
    TestBed.inject(ModoEmergenciaService).cambiar(true);
    clases().remove('modo-emergencia');
    TestBed.resetTestingModule();
    const modo = TestBed.inject(ModoEmergenciaService);
    expect(modo.activo()).toBe(true);
    expect(clases().contains('modo-emergencia')).toBe(true);
  });
});
