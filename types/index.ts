// Tipos base do sistema de estoque

export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  logo_url?: string
  ativo: boolean
  created_at?: string
  // Campo extra vindo do join (não persiste)
  papel?: string
}

export interface UsuarioEmpresa {
  id: string
  user_id: string
  empresa_id: string
  papel: string
  created_at?: string
  // Relacionamentos
  empresa?: Empresa
}

export interface Grupo {
  id: string
  nome: string
  created_at?: string
  // Relacionamentos
  subgrupos?: Subgrupo[]
}

export interface Subgrupo {
  id: string
  grupo_id: string
  nome: string
  created_at?: string
  // Relacionamentos
  grupo?: Grupo
}

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
  empresa_id?: string
  created_at?: string
}

export interface Destino {
  id: string
  nome: string
  ativo: boolean
  created_at?: string
}

export interface Fornecedor {
  id: string
  nome_empresa: string
  cnpj: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  ativo: boolean
  created_at?: string
}

export interface Produto {
  id: string
  categoria_id?: string
  subgrupo_id?: string
  nome: string
  unidade_id: string
  estoque_inicial: number
  preco_inicial: number
  estoque_minimo: number
  margem_seguranca: number
  tempo_reposicao: number
  beneficiavel: boolean
  eficiencia_beneficiamento: number | null
  is_produto_final: boolean
  ativo: boolean
  created_at?: string
  // Relacionamentos
  categoria?: Categoria
  subgrupo?: Subgrupo
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
  fornecedor_id?: string
  data: string
  semana: string
  quantidade: number
  custo_unitario: number
  valor_total: number
  numero_nf?: string
  observacao?: string
  origem_beneficiamento?: boolean
  gramatura?: number | null
  created_at?: string
  // Relacionamentos
  produto?: Produto
  fornecedor?: Fornecedor
}

export type TipoSaida = 'transferencia' | 'definitiva' | 'beneficiamento'

export interface Saida {
  id: string
  produto_id: string
  tipo: TipoSaida
  destino_id?: string
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

export interface ItemSaida {
  produto_id: string
  quantidade: number
  observacao: string
  showObs: boolean
}

export interface ProdutoBeneficiamento {
  id: string
  produto_origem_id: string
  produto_final_id: string
  empresa_id?: string
  created_at?: string
  // Relacionamentos
  produto_final?: Produto
  produto_origem?: Produto
}

export interface Beneficiamento {
  id: string
  saida_id: string
  status: 'pendente' | 'resolvido'
  data_resolucao?: string
  empresa_id?: string
  created_at?: string
  // Relacionamentos
  saida?: Saida
}

export interface BeneficiamentoItem {
  id: string
  beneficiamento_id: string
  entrada_id: string
  produto_final_id: string
  quantidade: number
  created_at?: string
  // Relacionamentos
  produto_final?: Produto
  entrada?: Entrada
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
  saldo_principal: number
  saldo_apoio: number
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
  entradas_por_semana: number[]
  saidas_por_semana: number[]
  total_saidas: number
  total_entradas: number
  estoque_final: number
  custo: number
  valor_total: number
  cmv: number
  giro_dias: number
  vezes_mes: number
}

export interface SemanaInfo {
  label: string
  tooltip: string
  inicio: string
  fim: string
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
  subgrupo: string
  nome: string
  unidade: string
  quantidade_estoque: number
  semana1: number
  semana1_periodo: string
  semana2: number
  semana2_periodo: string
  semana3: number
  semana3_periodo: string
  media_semanas: number
}

export interface GestaoInventario {
  produto_id: string
  produto: string
  categoria: string
  grupo: string
  subgrupo: string
  unidade: string
  ei_quantidade: number
  ei_valor: number
  ef_quantidade: number
  ef_valor: number
  custo_ultima_entrada: number
  variacao_quantidade: number
  variacao_valor: number
  sem_movimentacao: boolean
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


export interface FaturamentoSemanal {
  id?: string
  empresa_id?: string
  ano: number
  semana_inicio: string // date yyyy-mm-dd (segunda)
  semana_fim: string    // date yyyy-mm-dd (domingo)
  valor: number
}

export interface CmcSemanalGrupo {
  grupo_id: string
  grupo_nome: string
  subgrupos: CmcSemanalSubgrupo[]
  totais_semanas: number[] // valor total entradas por semana
}

export interface CmcSemanalSubgrupo {
  subgrupo_id: string
  subgrupo_nome: string
  totais_semanas: number[] // valor total entradas por semana
}

export interface CmcSemanalResumo {
  semanas: {
    inicio: string  // dd/mm
    fim: string     // dd/mm
    inicio_date: string // yyyy-mm-dd
    fim_date: string    // yyyy-mm-dd
  }[]
  grupos: CmcSemanalGrupo[]
  faturamentos: number[] // faturamento por semana (input manual)
  cmc_percentuais: number[] // CMC % = entradas / faturamento * 100
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
  tipo_saida?: TipoSaida | 'todos'
}

// Setores para contagem de inventário
export interface Setor {
  id: string
  nome: string
  descricao?: string
  empresa_id?: string
  created_at?: string
  produtos?: SetorProduto[]
}

export interface SetorProduto {
  id: string
  setor_id: string
  produto_id: string
  empresa_id?: string
  created_at?: string
  produto?: Produto
}

// Contagem (persistida no banco)
export type StatusContagem = 'aguardando' | 'pendente' | 'atrasada' | 'em_andamento' | 'finalizada'
export type TipoContagem = 'inventario' | 'estoque'

export interface Contagem {
  id: string
  empresa_id?: string
  nome: string
  tipo: TipoContagem
  data: string
  status: StatusContagem
  recorrencia?: string
  horario_notificacao?: string
  dias_semana?: string[]
  mensal_posicao?: string
  mensal_dia?: string
  responsavel_nome?: string
  responsavel_telefone?: string
  ultima_contagem?: string
  progresso?: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  contagem_setores?: ContagemSetorRel[]
}

export interface ContagemSetorRel {
  id: string
  contagem_id: string
  setor_id: string
  setor?: Setor
}

// Tipos para Contagem de Estoque (inventário em lote)

export interface ContagemItem {
  produto_id: string
  nome: string
  unidade_sigla: string
  subgrupo_nome: string
  grupo_nome: string
  saldo_sistema: number
  quantidade_contada: number | null
  diferenca: number | null
  custo_medio: number
  valor_divergencia: number | null
}

export interface ContagemHistorico {
  data: string
  motivo: string
  tipo_contagem: TipoContagem
  setor_nome?: string
  grupo_nome: string
  subgrupo_nome?: string
  total_itens: number
  total_sobras: number
  total_faltas: number
  total_zerados: number
  valor_total_divergencia: number
  ajustes: Ajuste[]
}

// Tipos para Pedidos de Compra
export interface Pedido {
  id: string
  empresa_id?: string
  data: string
  observacao?: string
  status: 'rascunho' | 'enviado' | 'concluido'
  created_at?: string
  // Relacionamentos
  itens?: PedidoItem[]
}

export interface PedidoItem {
  id: string
  pedido_id: string
  produto_id: string
  fornecedor_id?: string
  quantidade: number
  observacao?: string
  created_at?: string
  // Relacionamentos
  produto?: Produto
  fornecedor?: Fornecedor
}

export interface PedidoContagemItem {
  produto_id: string
  nome: string
  unidade_sigla: string
  subgrupo_nome: string
  quantidade: number | null
  fornecedor_id: string
  observacao: string
}
