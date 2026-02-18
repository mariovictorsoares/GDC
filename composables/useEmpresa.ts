import type { Empresa, UsuarioEmpresa } from '~/types'

// Estado global compartilhado entre componentes
const empresaAtiva = ref<Empresa | null>(null)
const empresas = ref<Empresa[]>([])
const carregando = ref(false)

export const useEmpresa = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  // Buscar empresas do usuário
  const getEmpresas = async (): Promise<Empresa[]> => {
    if (!user.value) return []

    const { data, error } = await client
      .from('usuarios_empresas')
      .select(`
        empresa_id,
        papel,
        empresa:empresas(*)
      `)
      .eq('user_id', user.value.id)

    if (error) throw error

    const lista = (data || [])
      .map((ue: any) => ({
        ...ue.empresa,
        papel: ue.papel
      }))
      .filter((e: any) => e.ativo !== false)

    empresas.value = lista
    return lista
  }

  // Selecionar empresa ativa
  const setEmpresaAtiva = (empresa: Empresa) => {
    empresaAtiva.value = empresa
    // Persistir no localStorage
    if (import.meta.client) {
      localStorage.setItem('empresa_ativa_id', empresa.id)
    }
  }

  // Carregar empresa ativa do localStorage ou primeira disponível
  const carregarEmpresaAtiva = async () => {
    if (carregando.value) return
    carregando.value = true

    try {
      const lista = await getEmpresas()

      if (lista.length === 0) return

      // Tentar restaurar do localStorage
      if (import.meta.client) {
        const idSalvo = localStorage.getItem('empresa_ativa_id')
        if (idSalvo) {
          const encontrada = lista.find(e => e.id === idSalvo)
          if (encontrada) {
            empresaAtiva.value = encontrada
            carregando.value = false
            return
          }
        }
      }

      // Fallback: primeira empresa
      empresaAtiva.value = lista[0]
      if (import.meta.client) {
        localStorage.setItem('empresa_ativa_id', lista[0].id)
      }
    } finally {
      carregando.value = false
    }
  }

  // Criar empresa e vincular ao usuário
  const criarEmpresa = async (nome: string, cnpj?: string): Promise<Empresa> => {
    if (!user.value) throw new Error('Usuário não autenticado')

    const insertData: any = { nome }
    if (cnpj) insertData.cnpj = cnpj

    const { data: empresa, error: empError } = await client
      .from('empresas')
      .insert(insertData)
      .select()
      .single()

    if (empError) throw empError

    // Vincular como admin
    const { error: vincError } = await client
      .from('usuarios_empresas')
      .insert({
        user_id: user.value.id,
        empresa_id: empresa.id,
        papel: 'admin'
      })

    if (vincError) throw vincError

    // Criar unidades padrão para a empresa
    const unidadesPadrao = [
      { sigla: 'KG', descricao: 'Quilograma' },
      { sigla: 'UN', descricao: 'Unidade' },
      { sigla: 'PC', descricao: 'Pacote' },
      { sigla: 'CX', descricao: 'Caixa' },
      { sigla: 'L', descricao: 'Litro' },
      { sigla: 'ML', descricao: 'Mililitro' },
      { sigla: 'G', descricao: 'Grama' },
      { sigla: 'DZ', descricao: 'Dúzia' },
      { sigla: 'FD', descricao: 'Fardo' },
      { sigla: 'PT', descricao: 'Pote' },
      { sigla: 'GF', descricao: 'Garrafa' },
      { sigla: 'LT', descricao: 'Lata' },
    ]

    const { error: unidadesError } = await client
      .from('unidades')
      .insert(unidadesPadrao.map(u => ({ ...u, empresa_id: empresa.id })))

    if (unidadesError) {
      console.error('Erro ao criar unidades padrão:', unidadesError)
    }

    // Criar grupos e subgrupos padrão para a empresa
    const gruposPadrao = [
      {
        nome: 'Alimentos',
        subgrupos: [
          'Mercearia', 'Alimentação funcionários', 'Hortifruti',
          'Proteínas bovinas, suínas e aves', 'Proteínas peixes e frutos do mar',
          'Congelados', 'Porcionados proteínas', 'Sorvetes e sobremesas',
          'Manipulado pronto', 'Fracionados internos',
          'Frutas e polpas congeladas', 'Laticínios e embutidos'
        ]
      },
      {
        nome: 'Bebidas',
        subgrupos: [
          'Águas, refrigerantes e similares', 'Cervejas', 'Chopp',
          'Destilados e similares', 'Xaropes prontos', 'Vinhos venda'
        ]
      },
      {
        nome: 'Embalagens',
        subgrupos: [
          'Embalagens delivery', 'Copos descartáveis, canudos e similares'
        ]
      },
      {
        nome: 'Consumo',
        subgrupos: [
          'Descartáveis de salão', 'Material de expediente e escritório',
          'Gelo e carvão', 'Descartáveis de cozinha'
        ]
      },
      {
        nome: 'Limpeza',
        subgrupos: [
          'Desinfetantes e detergentes', 'Descartáveis de limpeza',
          'Utensílios de limpeza'
        ]
      }
    ]

    for (const grupo of gruposPadrao) {
      const { data: grupoData, error: grupoError } = await client
        .from('grupos')
        .insert({ nome: grupo.nome, empresa_id: empresa.id })
        .select('id')
        .single()

      if (grupoError) {
        console.error(`Erro ao criar grupo ${grupo.nome}:`, grupoError)
        continue
      }

      const { error: subError } = await client
        .from('subgrupos')
        .insert(grupo.subgrupos.map(nome => ({
          grupo_id: grupoData.id,
          nome,
          empresa_id: empresa.id
        })))

      if (subError) {
        console.error(`Erro ao criar subgrupos de ${grupo.nome}:`, subError)
      }
    }

    // Atualizar lista e selecionar
    await getEmpresas()
    setEmpresaAtiva(empresa as Empresa)

    return empresa as Empresa
  }

  // Atualizar empresa
  const atualizarEmpresa = async (id: string, dados: Partial<Empresa>): Promise<Empresa> => {
    const { data, error } = await client
      .from('empresas')
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Atualizar na lista local
    const idx = empresas.value.findIndex(e => e.id === id)
    if (idx >= 0) {
      empresas.value[idx] = { ...empresas.value[idx], ...data }
    }
    if (empresaAtiva.value?.id === id) {
      empresaAtiva.value = { ...empresaAtiva.value, ...data }
    }

    return data as Empresa
  }

  // Deletar empresa
  const deletarEmpresa = async (id: string) => {
    const { error } = await client
      .from('empresas')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Se deletou a ativa, trocar para outra
    if (empresaAtiva.value?.id === id) {
      const lista = await getEmpresas()
      if (lista.length > 0) {
        setEmpresaAtiva(lista[0])
      } else {
        empresaAtiva.value = null
      }
    } else {
      await getEmpresas()
    }
  }

  // ID da empresa ativa (atalho para queries)
  const empresaId = computed(() => empresaAtiva.value?.id || null)

  return {
    // Estado
    empresaAtiva: readonly(empresaAtiva),
    empresas: readonly(empresas),
    carregando: readonly(carregando),
    empresaId,

    // Ações
    getEmpresas,
    setEmpresaAtiva,
    carregarEmpresaAtiva,
    criarEmpresa,
    atualizarEmpresa,
    deletarEmpresa
  }
}
