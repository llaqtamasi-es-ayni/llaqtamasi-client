export type TipoPublicacion = 'OFREZCO' | 'NECESITO';

export interface PublicacionMuro {
  id: string;
  tipo: TipoPublicacion;
  categoria: string;
  texto: string;
}
