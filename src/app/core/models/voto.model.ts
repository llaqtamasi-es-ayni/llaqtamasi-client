export type ValorVoto = 1 | 2 | 3 | 4 | 5;

export interface Voto {
  autorId: string;
  perfilId: string;
  valor: ValorVoto;
}
