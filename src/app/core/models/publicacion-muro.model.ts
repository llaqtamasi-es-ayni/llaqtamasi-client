export type TipoPublicacion = 'OFREZCO' | 'NECESITO';

export interface PublicacionMuro {
  id: string;
  autorId?: string;
  expiraEn?: string | null;
  tipo: TipoPublicacion;
  categoria: string;
  texto: string;
}
