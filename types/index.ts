// Tipos base do sistema de estoque

export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  logo_url?: string
  ativo: boolean
  created_at?: string
  sugerir_transferencia_apoio?: boolean
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
  created_at?: string
  // Relacionamentos
  produto?: Produto
  fornecedor?: Fornecedor
}

export type TipoSaida = 'transferencia' | 'definitiva'

export interface Saida {
  id: string
  produto_id: string
  tipo: TipoSaida
  destino_id?: string
  empresa_destino_id?: string
  data: string
  semana: string
  quantidade: number
  custo_saida: number
  observacao?: string
  created_at?: string
  // Relacionamentos
  produto?: Produto
  destino?: Destino
  empresa_destino?: Empresa
}

export interface ItemSaida {
  produto_id: string
  quantidade: number
  observacao: string
  showObs: boolean
}

export interface TransferenciaPendente {
  id: string
  empresa_origem_id: string
  empresa_destino_id: string
  produto_origem_id: string
  produto_destino_id: string
  quantidade: number
  custo_unitario: number
  custo_total: number
  data: string
  observacao?: string
  status: 'pendente' | 'confirmada' | 'rejeitada'
  data_resolucao?: string
  created_at?: string
  // Relacionamentos
  empresa_origem?: Empresa
  empresa_destino?: Empresa
  produto_origem?: Produto
  produto_destino?: Produto
}

export interface Ajuste {
  id: string
  produto_id: string
  contagem_id?: string
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
  // Breakdown de saídas por semana e tipo
  saidas_definitiva_por_semana: number[]
  saidas_transf_loja_por_semana: number[]
  saidas_transf_apoio_por_semana: number[]
  total_saidas: number
  total_entradas: number
  estoque_final: number
  custo: number
  valor_total: number
  cmv: number
  giro_dias: number
  vezes_mes: number
  // Breakdown de saídas por tipo
  saidas_definitiva: number
  saidas_transf_loja: number
  saidas_transf_apoio: number
}

export interface SemanaInfo {
  label: string
  tooltip: string
  inicio: string
  fim: string
}

export interface DiaInfo {
  label: string
  data: string
}

export interface PainelMesApoio {
  produto_id: string
  produto: string
  unidade: string
  estoque_inicial: number
  entradas_por_dia: number[]
  saidas_por_dia: number[]
  total_entradas: number
  total_saidas: number
  estoque_final: number
}

export interface MapaVisualApoioDia {
  data: string
  ei: number
  en: number
  ef: number
  cmv: number
}

export interface MapaVisualApoioSemana {
  label: string
  dias: MapaVisualApoioDia[]
}

export interface MapaVisualApoioItem {
  produto_id: string
  produto: string
  unidade: string
  semanas: MapaVisualApoioSemana[]
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
  // Split principal/apoio
  ei_quantidade_principal: number
  ei_valor_principal: number
  ef_quantidade_principal: number
  ef_valor_principal: number
  ei_quantidade_apoio: number
  ei_valor_apoio: number
  ef_quantidade_apoio: number
  ef_valor_apoio: number
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
    label: string   // S1, S2...
    tooltip: string // dd/mm - dd/mm
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
  tipo: 'principal' | 'apoio'
  empresa_id?: string
  token_requisicao?: string
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
export type TipoContagem = 'principal' | 'apoio' | 'inventario'

export interface Contagem {
  id: string
  empresa_id?: string
  token?: string
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
  resultados?: ContagemResultado[]
  created_at?: string
  updated_at?: string
  // Relacionamentos
  contagem_setores?: ContagemSetorRel[]
}

export interface ContagemSetorRel {
  id: string
  contagem_id: string
  setor_id: string
  status?: string
  progresso?: number
  finalizado_em?: string
  setor?: Setor
}

// Item de contagem persistido no banco (tabela contagem_itens)
export interface ContagemItemDB {
  id: string
  contagem_id: string
  setor_id: string
  produto_id: string
  quantidade_contada: number | null
  ajuste_registrado: boolean
  saldo_no_momento: number | null
  empresa_id?: string
  created_at?: string
  updated_at?: string
  produto?: Produto
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

// Snapshot de uma contagem finalizada (armazenado em contagens.resultados JSONB)
export interface ContagemResultadoItem {
  produto_id: string
  nome: string
  unidade_sigla: string
  saldo_sistema: number
  quantidade_contada: number
  diferenca: number
  custo_medio: number
  valor_divergencia: number
}

export interface ContagemResultado {
  ciclo: number
  data: string
  finalizado_em: string
  motivo: string
  resumo: {
    total_contados: number
    total_nao_contados: number
    total_sobras: number
    total_faltas: number
    valor_total_divergencia: number
  }
  itens: ContagemResultadoItem[]
}

// Tipos para Pedidos de Compra
export interface Pedido {
  id: string
  empresa_id?: string
  data: string
  nome?: string
  observacao?: string
  status: 'rascunho' | 'enviado' | 'em_andamento' | 'finalizada' | 'concluido'
  previsao_recebimento?: string
  responsavel_nome?: string
  responsavel_telefone?: string
  data_recebimento?: string
  valor_estimado?: number
  origem?: 'manual' | 'reposicao'
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
  preco_estimado?: number
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

// =============================================
// Billing / Assinaturas
// =============================================

export interface Plano {
  id: string
  nome: string
  slug: string
  descricao?: string
  preco_mensal: number
  stripe_product_id?: string
  stripe_price_id?: string
  recursos: string[]
  ativo: boolean
  ordem: number
  created_at?: string
}

export interface Assinatura {
  id: string
  empresa_id: string
  plano_id?: string
  status: 'trial' | 'active' | 'free' | 'past_due' | 'cancelled' | 'expired' | 'blocked'
  trial_inicio: string
  trial_fim: string
  grace_fim?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  taxa_implementacao_paga: boolean
  data_ativacao?: string
  data_cancelamento?: string
  trial_estendido_por?: string
  observacao_admin?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  plano?: Plano
}

export type SubscriptionStateName =
  | 'trial'
  | 'trial_warning'
  | 'grace'
  | 'blocked'
  | 'active'
  | 'past_due'
  | 'cancelled'

export interface SubscriptionState {
  state: SubscriptionStateName
  diasRestantes: number | null
  mensagem: string
}

// =============================================
// Requisições (solicitação setor → estoquista)
// =============================================

export type StatusRequisicao = 'pendente' | 'enviado' | 'cancelado'

export interface Requisicao {
  id: string
  empresa_id: string
  setor_id: string
  status: StatusRequisicao
  data: string
  solicitante_nome?: string
  observacao?: string
  enviado_por?: string
  data_envio?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  setor?: Setor
  itens?: RequisicaoItem[]
}

export interface RequisicaoItem {
  id: string
  requisicao_id: string
  produto_id: string
  quantidade_solicitada: number
  quantidade_enviada?: number
  created_at?: string
  // Relacionamentos
  produto?: Produto
}
