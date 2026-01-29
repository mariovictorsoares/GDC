// Tipos base do sistema de estoque

export interface Categoria {
  id: string
  nome: string
  codigo?: string
  created_at?: string
}

export interface Unidade {
  id: string
  sigla: string
  descricao?: string
}

export interface Destino {
  id: string
  nome: string
  ativo: boolean
}

export interface Produto {
  id: string
  categoria_id: string
  nome: string
  unidade_id: string
  estoque_inicial: number
  preco_inicial: number
  estoque_minimo: number
  margem_seguranca: number
  tempo_reposicao: number
  ativo: boolean
  created_at?: string
  // Relacionamentos
  categoria?: Categoria
  unidade?: Unidade
}

export interface CustoMensal {
  id: string
  produto_id: string
  ano: number
  mes: number
  custo: number
}

export interface Entrada {
  id: string
  produto_id: string
  data: string
  semana: string
  quantidade: number
  custo_unitario: number
  valor_total: number
  numero_nf?: string
  observacao?: string
  created_at?: string
  // Relacionamentos
  produto?: Produto
}

export interface Saida {
  id: string
  produto_id: string
  destino_id: string
  data: string
  semana: string
  quantidade: number
  custo_saida: number
  observacao?: string
  created_at?: string
  // Relacionamentos
  produto?: Produto
  destino?: Destino
}

export interface Ajuste {
  id: string
  produto_id: string
  data: string
  semana: string
  quantidade: number
  motivo?: string
  created_at?: string
  // Relacionamentos
  produto?: Produto
}

export interface Faturamento {
  id: string
  ano: number
  mes: number
  valor: number
}

export interface Configuracao {
  id: string
  chave: string
  valor: string
}

// Tipos para relatórios
export interface SaldoEstoque {
  produto_id: string
  categoria: string
  produto: string
  unidade: string
  estoque_inicial: number
  total_entradas: number
  total_saidas: number
  total_ajustes: number
  saldo_atual: number
  custo_medio: number
  valor_estoque: number
}

export interface PainelMes {
  produto_id: string
  categoria: string
  produto: string
  unidade: string
  estoque_inicial: number
  saidas_semana1: number
  saidas_semana2: number
  saidas_semana3: number
  saidas_semana4: number
  saidas_semana5: number
  saidas_semana6: number
  total_saidas: number
  entradas_semana1: number
  entradas_semana2: number
  entradas_semana3: number
  entradas_semana4: number
  entradas_semana5: number
  entradas_semana6: number
  total_entradas: number
  estoque_final: number
  custo: number
  valor_total: number
  cmv: number
  giro_dias: number
  vezes_mes: number
}

export interface CurvaABC {
  produto_id: string
  produto: string
  categoria: string
  quantidade: number
  valor: number
  percentual_valor: number
  percentual_acumulado: number
  classe: 'A' | 'B' | 'C'
  classe_cmv?: 'A' | 'B' | 'C'
  status_comparativo?: string
}

export interface GiroEstoque {
  ano: number
  mes: string
  estoque_real: number
  estoque_medio: number
  cmv: number
  giro_dias_real: number
  vezes_mes_real: number
  giro_dias_medio: number
  vezes_mes_medio: number
}

export interface CMV {
  ano: number
  mes: number
  estoque_inicial: number
  compras: number
  estoque_final: number
  cmv: number
  faturamento: number
  percentual_cmv: number
}

export interface EstoqueMinimo {
  produto_id: string
  categoria: string
  nome: string
  quantidade_estoque: number
  unidade: string
  estoque_minimo: number
  estoque_minimo_base: number
  margem_seguranca: number
  consumo_medio_semanal: number
  consumo_medio_diario: number
  tempo_reposicao: number
  repor_estoque: boolean
  dias_ate_ruptura: number
  data_ponto_pedido: string
  status_prazo: 'ATRASADO' | 'EM TEMPO' | 'OK'
  dentro_prazo: boolean
  sugestao_pedido: number
}

// Tipos utilitários
export type SemanaDoMes = 'SEMANA 1' | 'SEMANA 2' | 'SEMANA 3' | 'SEMANA 4' | 'SEMANA 5' | 'SEMANA 6'

export interface ComparativoABC {
  produto_id: string
  produto: string
  categoria: string
  classe_estoque: 'A' | 'B' | 'C'
  classe_cmv: 'A' | 'B' | 'C'
  valor_estoque: number
  valor_cmv: number
  status: 'EQUILIBRADO' | 'ESTOQUE_EXCESSIVO' | 'RISCO_RUPTURA' | 'ATENÇÃO'
  recomendacao: string
}

export interface FolhaContagem {
  produto_id: string
  categoria: string
  produto: string
  unidade: string
  estoque_sistema: number
  domingo?: number
  segunda?: number
  terca?: number
  quarta?: number
  quinta?: number
  sexta?: number
  sabado?: number
}

export interface FiltroData {
  dataInicio?: string
  dataFim?: string
  ano?: number
  mes?: number
}

export interface FiltroRelatorio extends FiltroData {
  categoria_id?: string
  produto_id?: string
}
