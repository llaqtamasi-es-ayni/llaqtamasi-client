export interface Usuario {
  id: string;
  alias: string;
  verificado: boolean;
  /** Nivel de confianza calculado por el backend a partir de los avales de vecinos. */
  nivelConfianza: number;
}
