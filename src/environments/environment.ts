// `ng build` (producción) reemplaza este archivo por environment.prod.ts (ver angular.json).
export const environment = {
  production: false,
  /** URL base del backend Spring Boot. En el emulador Android, localhost del PC es 10.0.2.2. */
  apiUrl: 'http://localhost:8080/api',
  /** Permite usar datos simulados cuando el backend no está disponible. */
  usarMocks: false,
};


