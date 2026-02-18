<template>
  <div class="space-y-6">
    <!-- ============================================ -->
    <!-- ESTADO: TELA PRINCIPAL (lista + botão)       -->
    <!-- ============================================ -->
    <template v-if="etapa === 'principal'">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contagem de Estoque</h1>
          <p class="text-sm text-gray-500">Realize contagens físicas por grupo/subgrupo e registre as diferenças automaticamente</p>
        </div>
        <UButton color="primary" class="w-full sm:w-auto" @click="abrirModalSetup">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Nova Contagem
        </UButton>
      </div>

      <!-- Filtros do histórico -->
      <UCard>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UFormGroup label="Data Início">
            <UInput v-model="filtroDataInicio" type="date" />
          </UFormGroup>
          <UFormGroup label="Data Fim">
            <UInput v-model="filtroDataFim" type="date" />
          </UFormGroup>
          <UFormGroup label="Buscar">
            <UInput
              v-model="filtroBusca"
              placeholder="Buscar produto ou motivo..."
              icon="i-heroicons-magnifying-glass"
            />
          </UFormGroup>
          <div class="flex items-end">
            <UButton color="gray" variant="soft" class="w-full" @click="limparFiltrosHistorico">
              Limpar Filtros
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Resumo geral -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total de Ajustes</p>
              <p class="text-2xl font-bold text-gray-900">{{ ajustesFiltrados.length }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Sobras (positivos)</p>
              <p class="text-2xl font-bold text-green-600">+{{ formatNumber(totalSobras) }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-red-100 rounded-lg">
              <UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Faltas (negativos)</p>
              <p class="text-2xl font-bold text-red-600">{{ formatNumber(totalFaltas) }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Histórico de Contagens agrupado -->
      <UCard :ui="{ body: { padding: '' } }">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">Histórico de Contagens</h3>
        </template>

        <div v-if="loadingHistorico" class="flex items-center justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
          <span class="ml-2 text-gray-500">Carregando...</span>
        </div>

        <div v-else-if="contagensAgrupadas.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
          <UIcon name="i-heroicons-inbox" class="w-10 h-10 mb-3" />
          <p class="text-sm">Nenhuma contagem registrada</p>
          <p class="text-xs text-gray-400 mt-1">Clique em "Nova Contagem" para começar</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div v-for="(contagem, idx) in contagensAgrupadasPaginadas" :key="idx">
            <!-- Linha principal da contagem -->
            <button
              class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
              @click="toggleContagem(idx)"
            >
              <div class="flex items-center gap-4">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900">{{ contagem.motivo }}</p>
                  <p class="text-sm text-gray-500">
                    {{ formatDate(contagem.data) }}
                    <span class="mx-1">&middot;</span>
                    {{ contagem.total_itens }} {{ contagem.total_itens === 1 ? 'produto' : 'produtos' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex gap-3 text-sm">
                  <span v-if="contagem.total_sobras > 0" class="text-green-600 font-medium">
                    {{ contagem.total_sobras }} {{ contagem.total_sobras === 1 ? 'sobra' : 'sobras' }}
                  </span>
                  <span v-if="contagem.total_faltas > 0" class="text-red-600 font-medium">
                    {{ contagem.total_faltas }} {{ contagem.total_faltas === 1 ? 'falta' : 'faltas' }}
                  </span>
                  <span v-if="contagem.total_zerados > 0" class="text-gray-400">
                    {{ contagem.total_zerados }} ok
                  </span>
                </div>
                <UIcon
                  name="i-heroicons-chevron-down"
                  class="w-5 h-5 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': expandedContagens.has(idx) }"
                />
              </div>
            </button>

            <!-- Detalhes expandidos -->
            <div v-if="expandedContagens.has(idx)" class="bg-gray-50 px-6 py-4">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-500 border-b border-gray-200">
                      <th class="pb-2 font-medium">Produto</th>
                      <th class="pb-2 font-medium text-right">Ajuste</th>
                      <th class="pb-2 font-medium text-right w-20">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ajuste in contagem.ajustes" :key="ajuste.id" class="border-b border-gray-100 last:border-0">
                      <td class="py-2">
                        <p class="font-medium text-gray-900">{{ ajuste.produto?.nome || '-' }}</p>
                        <p class="text-xs text-gray-500">{{ ajuste.produto?.subgrupo?.grupo?.nome }} / {{ ajuste.produto?.subgrupo?.nome }}</p>
                      </td>
                      <td class="py-2 text-right">
                        <span
                          class="font-semibold"
                          :class="Number(ajuste.quantidade) > 0 ? 'text-green-600' : Number(ajuste.quantidade) < 0 ? 'text-red-600' : 'text-gray-400'"
                        >
                          {{ Number(ajuste.quantidade) > 0 ? '+' : '' }}{{ formatNumber(ajuste.quantidade) }}
                          {{ ajuste.produto?.unidade?.sigla || '' }}
                        </span>
                      </td>
                      <td class="py-2 text-right">
                        <UButton
                          color="red"
                          variant="ghost"
                          icon="i-heroicons-trash"
                          size="xs"
                          @click.stop="confirmarExclusaoItem(ajuste)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-3 flex justify-end">
                <UButton
                  color="red"
                  variant="soft"
                  size="sm"
                  @click="confirmarExclusaoContagem(contagem)"
                >
                  <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                  Excluir contagem inteira
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <TablePagination
          v-if="contagensAgrupadas.length > 0"
          v-model="pageHistorico"
          :page-size="pageSizeHistorico"
          :total-items="contagensAgrupadas.length"
          @update:page-size="pageSizeHistorico = $event"
        />
      </UCard>
    </template>

    <!-- ============================================ -->
    <!-- ETAPA 2: CONTAGEM EM LOTE (planilha)         -->
    <!-- ============================================ -->
    <template v-if="etapa === 'contagem'">
      <!-- Header com progresso -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" @click="confirmarSairContagem" />
          <div>
            <h1 class="text-xl font-bold text-gray-900">
              Contagem — {{ grupoSelecionadoNome }}{{ subgrupoSelecionadoNome ? ' / ' + subgrupoSelecionadoNome : '' }}
            </h1>
            <p class="text-sm text-gray-500">{{ formatDate(setupData) }}</p>
          </div>
        </div>
        <UButton color="primary" :disabled="itensContados === 0" @click="abrirRevisao">
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-2" />
          Finalizar Contagem
        </UButton>
      </div>

      <!-- Barra de progresso -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Progresso da contagem</span>
          <span class="text-sm font-bold" :class="itensContados === itensContagem.length ? 'text-green-600' : 'text-blue-600'">
            {{ itensContados }} de {{ itensContagem.length }} produtos
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="h-2.5 rounded-full transition-all duration-300"
            :class="itensContados === itensContagem.length ? 'bg-green-500' : 'bg-blue-500'"
            :style="{ width: progressoPercent + '%' }"
          />
        </div>
      </div>

      <!-- Busca rápida -->
      <UInput
        v-model="buscaContagem"
        placeholder="Buscar produto na lista..."
        icon="i-heroicons-magnifying-glass"
        size="lg"
      />

      <!-- Lista de contagem estilo planilha -->
      <UCard :ui="{ body: { padding: '' } }">
        <!-- Header da tabela -->
        <div class="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div class="col-span-4">Produto</div>
          <div class="col-span-2 text-right">Estoque Sistema</div>
          <div class="col-span-3 text-center">Qtd. Contada</div>
          <div class="col-span-3 text-right">Diferença</div>
        </div>

        <div class="divide-y divide-gray-100">
          <div
            v-for="(item, i) in itensContagemFiltrados"
            :key="item.produto_id"
            class="px-6 py-3 hover:bg-gray-50 transition-colors"
            :class="{
              'bg-green-50/50': item.diferenca !== null && item.diferenca > 0,
              'bg-red-50/50': item.diferenca !== null && item.diferenca < 0
            }"
          >
            <!-- Layout Desktop -->
            <div class="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
              <div class="col-span-4">
                <p class="font-medium text-gray-900">{{ item.nome }}</p>
                <p class="text-xs text-gray-500">{{ item.subgrupo_nome }} &middot; {{ item.unidade_sigla }}</p>
              </div>
              <div class="col-span-2 text-right">
                <span class="text-sm font-mono text-gray-600">{{ formatNumber(item.saldo_sistema) }}</span>
                <span class="text-xs text-gray-400 ml-1">{{ item.unidade_sigla }}</span>
              </div>
              <div class="col-span-3 flex justify-center">
                <UInput
                  :model-value="item.quantidade_contada"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="—"
                  size="sm"
                  class="w-32"
                  :ui="{ base: 'text-center font-mono text-base' }"
                  @update:model-value="atualizarContagem(item.produto_id, $event)"
                  @keydown.enter="focarProximo(i)"
                  :ref="(el: any) => setInputRef(i, el)"
                />
              </div>
              <div class="col-span-3 text-right">
                <template v-if="item.quantidade_contada !== null">
                  <span
                    class="text-sm font-bold font-mono"
                    :class="{
                      'text-green-600': item.diferenca !== null && item.diferenca > 0,
                      'text-red-600': item.diferenca !== null && item.diferenca < 0,
                      'text-gray-400': item.diferenca === 0
                    }"
                  >
                    {{ item.diferenca !== null && item.diferenca > 0 ? '+' : '' }}{{ formatNumber(item.diferenca) }}
                  </span>
                  <span class="text-xs ml-1" :class="{
                    'text-green-500': item.diferenca !== null && item.diferenca > 0,
                    'text-red-500': item.diferenca !== null && item.diferenca < 0,
                    'text-gray-400': item.diferenca === 0
                  }">
                    {{ item.diferenca !== null && item.diferenca > 0 ? 'sobra' : item.diferenca !== null && item.diferenca < 0 ? 'falta' : 'ok' }}
                  </span>
                </template>
                <span v-else class="text-sm text-gray-300">—</span>
              </div>
            </div>

            <!-- Layout Mobile -->
            <div class="sm:hidden space-y-2">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-900">{{ item.nome }}</p>
                  <p class="text-xs text-gray-500">{{ item.subgrupo_nome }} &middot; Sistema: {{ formatNumber(item.saldo_sistema) }} {{ item.unidade_sigla }}</p>
                </div>
                <template v-if="item.quantidade_contada !== null">
                  <span
                    class="text-sm font-bold"
                    :class="{
                      'text-green-600': item.diferenca !== null && item.diferenca > 0,
                      'text-red-600': item.diferenca !== null && item.diferenca < 0,
                      'text-gray-400': item.diferenca === 0
                    }"
                  >
                    {{ item.diferenca !== null && item.diferenca > 0 ? '+' : '' }}{{ formatNumber(item.diferenca) }}
                  </span>
                </template>
              </div>
              <UInput
                :model-value="item.quantidade_contada"
                type="number"
                step="0.0001"
                min="0"
                placeholder="Quantidade contada..."
                size="sm"
                :ui="{ base: 'font-mono' }"
                @update:model-value="atualizarContagem(item.produto_id, $event)"
              />
            </div>
          </div>
        </div>

        <!-- Empty filtro -->
        <div v-if="itensContagemFiltrados.length === 0 && buscaContagem" class="flex flex-col items-center justify-center py-8 text-gray-500">
          <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mb-2" />
          <p class="text-sm">Nenhum produto encontrado para "{{ buscaContagem }}"</p>
        </div>
      </UCard>
    </template>

    <!-- ============================================ -->
    <!-- ETAPA 3: REVISÃO E CONFIRMAÇÃO               -->
    <!-- ============================================ -->
    <template v-if="etapa === 'revisao'">
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" @click="etapa = 'contagem'" />
          <div>
            <h1 class="text-xl font-bold text-gray-900">Revisão da Contagem</h1>
            <p class="text-sm text-gray-500">
              {{ grupoSelecionadoNome }}{{ subgrupoSelecionadoNome ? ' / ' + subgrupoSelecionadoNome : '' }}
              — {{ formatDate(setupData) }}
            </p>
          </div>
        </div>

        <!-- Cards de resumo -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-blue-600">{{ itensContados }}</p>
              <p class="text-xs text-gray-500 mt-1">Contados</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-gray-400">{{ itensNaoContados }}</p>
              <p class="text-xs text-gray-500 mt-1">Não contados</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-green-600">{{ itensComSobra }}</p>
              <p class="text-xs text-gray-500 mt-1">Sobras</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-red-600">{{ itensComFalta }}</p>
              <p class="text-xs text-gray-500 mt-1">Faltas</p>
            </div>
          </UCard>
        </div>

        <!-- Lista de produtos com diferença -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Produtos com diferença</h3>
              <span class="text-sm text-gray-500">{{ itensComDiferenca.length }} {{ itensComDiferenca.length === 1 ? 'item' : 'itens' }}</span>
            </div>
          </template>

          <div v-if="itensComDiferenca.length === 0" class="text-center py-6 text-gray-500">
            <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-green-500 mb-2 mx-auto" />
            <p class="font-medium">Nenhuma diferença encontrada!</p>
            <p class="text-sm">Todos os produtos contados estão iguais ao sistema.</p>
          </div>

          <div v-else class="divide-y divide-gray-100 -mx-4 sm:-mx-6">
            <div
              v-for="item in itensComDiferenca"
              :key="item.produto_id"
              class="flex items-center justify-between px-4 sm:px-6 py-3"
            >
              <div>
                <p class="font-medium text-gray-900">{{ item.nome }}</p>
                <p class="text-xs text-gray-500">
                  Sistema: {{ formatNumber(item.saldo_sistema) }} → Contado: {{ formatNumber(item.quantidade_contada) }} {{ item.unidade_sigla }}
                </p>
              </div>
              <span
                class="font-bold text-sm"
                :class="item.diferenca! > 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ item.diferenca! > 0 ? '+' : '' }}{{ formatNumber(item.diferenca) }} {{ item.unidade_sigla }}
              </span>
            </div>
          </div>
        </UCard>

        <!-- Produtos sem diferença (contados mas OK) -->
        <UCard v-if="itensSemDiferenca.length > 0">
          <template #header>
            <h3 class="font-semibold text-gray-900">Produtos sem diferença (OK)</h3>
          </template>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="item in itensSemDiferenca"
              :key="item.produto_id"
              color="green"
              variant="subtle"
            >
              {{ item.nome }}
            </UBadge>
          </div>
        </UCard>

        <!-- Motivo -->
        <UCard>
          <UFormGroup label="Observação / Motivo da Contagem" required>
            <UTextarea
              v-model="motivoContagem"
              placeholder="Ex: Contagem semanal de rotina, Inventário mensal..."
              rows="3"
            />
          </UFormGroup>

          <div class="mt-4">
            <UCheckbox
              v-model="apenasComDiferenca"
              label="Salvar apenas produtos com diferença"
            />
            <p class="text-xs text-gray-500 ml-6 mt-1">
              Se desmarcado, salva todos os produtos contados (inclusive os sem diferença, com ajuste zero)
            </p>
          </div>
        </UCard>

        <!-- Botões de ação -->
        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="etapa = 'contagem'">
            Voltar para Contagem
          </UButton>
          <UButton
            color="primary"
            :loading="salvando"
            :disabled="!motivoContagem.trim() || itensContados === 0"
            @click="salvarContagem"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
            Confirmar e Salvar ({{ itensParaSalvar.length }} {{ itensParaSalvar.length === 1 ? 'ajuste' : 'ajustes' }})
          </UButton>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- MODAIS                                        -->
    <!-- ============================================ -->

    <!-- Modal: Setup da Nova Contagem -->
    <UModal
      v-model="modalSetupOpen"
      :ui="{
        width: 'sm:max-w-xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-100 rounded-lg">
                <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Nova Contagem</h3>
                <p class="text-xs text-gray-500">Selecione o grupo e subgrupo para contar</p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalSetupOpen = false"
            />
          </div>
        </template>

        <div class="space-y-5">
          <UFormGroup label="Data da Contagem" required>
            <UInput v-model="setupData" type="date" />
          </UFormGroup>

          <!-- Divider -->
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <UFormGroup label="Grupo" required>
            <USelect
              v-model="setupGrupoId"
              :options="grupoOptions"
              placeholder="Selecione o grupo..."
            />
          </UFormGroup>

          <UFormGroup label="Subgrupo">
            <USelect
              v-model="setupSubgrupoId"
              :options="subgrupoOptions"
              placeholder="Todos os subgrupos"
              :disabled="!setupGrupoId"
            />
            <p class="text-xs text-gray-500 mt-1">
              Opcional — se não selecionar, conta todos os produtos do grupo
            </p>
          </UFormGroup>

          <!-- Info de produtos -->
          <div v-if="setupGrupoId" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600" />
              <span class="text-sm text-blue-800 font-medium">
                {{ produtosParaContar.length }} {{ produtosParaContar.length === 1 ? 'produto será contado' : 'produtos serão contados' }}
              </span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalSetupOpen = false">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              class="w-full sm:w-auto"
              :disabled="!setupGrupoId || produtosParaContar.length === 0"
              :loading="loadingSetup"
              @click="iniciarContagem"
            >
              <UIcon name="i-heroicons-play" class="w-4 h-4 mr-1.5" />
              Iniciar Contagem
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Sair da contagem -->
    <UModal
      v-model="modalSairOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-yellow-700">Sair da contagem?</h3>
        </template>

        <p>Você tem <strong>{{ itensContados }}</strong> {{ itensContados === 1 ? 'produto contado' : 'produtos contados' }}. Se sair agora, todos os dados serão perdidos.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalSairOpen = false">Continuar contando</UButton>
            <UButton color="red" class="w-full sm:w-auto" @click="descartarContagem">Descartar e sair</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Sucesso + continuar? -->
    <UModal
      v-model="modalSucessoOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold">Contagem salva!</h3>
          </div>
        </template>

        <p>{{ resumoSalvamento }}</p>
        <p class="mt-2 text-sm text-gray-500">Deseja realizar outra contagem?</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="fecharSucesso">Não, finalizar</UButton>
            <UButton color="primary" class="w-full sm:w-auto" @click="novaContagemAposSucesso">Sim, contar outro grupo</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Excluir item individual -->
    <UModal
      v-model="modalExcluirItemOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Ajuste</h3>
        </template>

        <p>Tem certeza que deseja excluir o ajuste de <strong>{{ ajusteParaExcluir?.produto?.nome }}</strong>?</p>
        <div v-if="ajusteParaExcluir" class="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
          <p><strong>Data:</strong> {{ formatDate(ajusteParaExcluir.data) }}</p>
          <p><strong>Ajuste:</strong> {{ formatNumber(ajusteParaExcluir.quantidade) }}</p>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirItemOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirItemConfirmado">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Excluir contagem inteira -->
    <UModal
      v-model="modalExcluirContagemOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Contagem Inteira</h3>
        </template>

        <p>Tem certeza que deseja excluir <strong>todos os {{ contagemParaExcluir?.total_itens }} ajustes</strong> desta contagem?</p>
        <div v-if="contagemParaExcluir" class="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
          <p><strong>Motivo:</strong> {{ contagemParaExcluir.motivo }}</p>
          <p><strong>Data:</strong> {{ formatDate(contagemParaExcluir.data) }}</p>
        </div>
        <p class="text-sm text-red-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirContagemOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirContagemConfirmada">Excluir tudo</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Ajuste, Produto, Grupo, Subgrupo, SaldoEstoque, ContagemItem, ContagemHistorico } from '~/types'

const toast = useToast()
const {
  getGrupos, getSubgrupos, getProdutos,
  getSaldoEstoque,
  getAjustes, createAjustesEmLote, deleteAjuste: removeAjuste, deleteAjustesEmLote
} = useEstoque()
const { empresaId } = useEmpresa()

// ==========================================
// ESTADO GERAL
// ==========================================
type Etapa = 'principal' | 'contagem' | 'revisao'
const etapa = ref<Etapa>('principal')

// ==========================================
// DADOS BASE
// ==========================================
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const produtos = ref<Produto[]>([])
const saldos = ref<SaldoEstoque[]>([])
const todosAjustes = ref<Ajuste[]>([])
const loadingHistorico = ref(true)

// ==========================================
// SETUP MODAL
// ==========================================
const modalSetupOpen = ref(false)
const setupData = ref(new Date().toISOString().split('T')[0])
const setupGrupoId = ref('')
const setupSubgrupoId = ref('')
const loadingSetup = ref(false)

const grupoOptions = computed(() => [
  { label: 'Selecione...', value: '' },
  ...grupos.value.map(g => ({ label: g.nome, value: g.id }))
])

const subgrupoOptions = computed(() => {
  if (!setupGrupoId.value) return [{ label: 'Selecione um grupo primeiro', value: '' }]
  const subs = subgrupos.value.filter(s => s.grupo_id === setupGrupoId.value)
  return [
    { label: 'Todos os subgrupos', value: '' },
    ...subs.map(s => ({ label: s.nome, value: s.id }))
  ]
})

const produtosParaContar = computed(() => {
  if (!setupGrupoId.value) return []
  return produtos.value.filter(p => {
    if (!p.subgrupo_id) return false
    const sub = subgrupos.value.find(s => s.id === p.subgrupo_id)
    if (!sub) return false
    if (setupSubgrupoId.value) {
      return p.subgrupo_id === setupSubgrupoId.value
    }
    return sub.grupo_id === setupGrupoId.value
  })
})

const grupoSelecionadoNome = computed(() => {
  const g = grupos.value.find(g => g.id === setupGrupoId.value)
  return g?.nome || ''
})

const subgrupoSelecionadoNome = computed(() => {
  if (!setupSubgrupoId.value) return ''
  const s = subgrupos.value.find(s => s.id === setupSubgrupoId.value)
  return s?.nome || ''
})

// Limpar subgrupo quando grupo mudar
watch(setupGrupoId, () => {
  setupSubgrupoId.value = ''
})

// ==========================================
// CONTAGEM EM LOTE (etapa 2)
// ==========================================
const itensContagem = ref<ContagemItem[]>([])
const buscaContagem = ref('')
const inputRefs = ref<Record<number, any>>({})

const setInputRef = (index: number, el: any) => {
  if (el) {
    inputRefs.value[index] = el
  }
}

const focarProximo = (currentIndex: number) => {
  const nextIndex = currentIndex + 1
  const nextEl = inputRefs.value[nextIndex]
  if (nextEl?.$el) {
    const input = nextEl.$el.querySelector('input')
    if (input) input.focus()
  }
}

const itensContagemFiltrados = computed(() => {
  if (!buscaContagem.value) return itensContagem.value
  const term = buscaContagem.value.toLowerCase()
  return itensContagem.value.filter(item =>
    item.nome.toLowerCase().includes(term) ||
    item.subgrupo_nome.toLowerCase().includes(term)
  )
})

const atualizarContagem = (produtoId: string, valor: any) => {
  const item = itensContagem.value.find(i => i.produto_id === produtoId)
  if (!item) return

  const num = valor === '' || valor === null || valor === undefined ? null : Number(valor)
  item.quantidade_contada = num
  item.diferenca = num !== null ? num - item.saldo_sistema : null
}

const itensContados = computed(() => itensContagem.value.filter(i => i.quantidade_contada !== null).length)
const itensNaoContados = computed(() => itensContagem.value.length - itensContados.value)
const itensComSobra = computed(() => itensContagem.value.filter(i => i.diferenca !== null && i.diferenca > 0).length)
const itensComFalta = computed(() => itensContagem.value.filter(i => i.diferenca !== null && i.diferenca < 0).length)
const itensComDiferenca = computed(() => itensContagem.value.filter(i => i.diferenca !== null && i.diferenca !== 0))
const itensSemDiferenca = computed(() => itensContagem.value.filter(i => i.quantidade_contada !== null && i.diferenca === 0))

const progressoPercent = computed(() => {
  if (itensContagem.value.length === 0) return 0
  return Math.round((itensContados.value / itensContagem.value.length) * 100)
})

// ==========================================
// REVISÃO (etapa 3)
// ==========================================
const motivoContagem = ref('')
const apenasComDiferenca = ref(true)
const salvando = ref(false)
const resumoSalvamento = ref('')

const itensParaSalvar = computed(() => {
  if (apenasComDiferenca.value) {
    return itensContagem.value.filter(i => i.diferenca !== null && i.diferenca !== 0)
  }
  return itensContagem.value.filter(i => i.quantidade_contada !== null)
})

// ==========================================
// HISTÓRICO (tela principal)
// ==========================================
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const filtroBusca = ref('')
const pageHistorico = ref(1)
const pageSizeHistorico = ref(10)
const expandedContagens = ref(new Set<number>())

const ajustesFiltrados = computed(() => {
  let result = todosAjustes.value

  if (filtroBusca.value) {
    const term = filtroBusca.value.toLowerCase()
    result = result.filter(a =>
      a.produto?.nome?.toLowerCase().includes(term) ||
      a.motivo?.toLowerCase().includes(term)
    )
  }

  return result
})

const totalSobras = computed(() =>
  ajustesFiltrados.value
    .filter(a => Number(a.quantidade) > 0)
    .reduce((sum, a) => sum + Number(a.quantidade), 0)
)

const totalFaltas = computed(() =>
  ajustesFiltrados.value
    .filter(a => Number(a.quantidade) < 0)
    .reduce((sum, a) => sum + Number(a.quantidade), 0)
)

// Agrupar ajustes por data+motivo para exibir como "contagens"
const contagensAgrupadas = computed<ContagemHistorico[]>(() => {
  const map = new Map<string, ContagemHistorico>()

  for (const ajuste of ajustesFiltrados.value) {
    const key = `${ajuste.data}||${ajuste.motivo || 'Sem motivo'}`
    if (!map.has(key)) {
      map.set(key, {
        data: ajuste.data,
        motivo: ajuste.motivo || 'Sem motivo',
        grupo_nome: ajuste.produto?.subgrupo?.grupo?.nome || '',
        subgrupo_nome: ajuste.produto?.subgrupo?.nome || '',
        total_itens: 0,
        total_sobras: 0,
        total_faltas: 0,
        total_zerados: 0,
        ajustes: []
      })
    }
    const contagem = map.get(key)!
    contagem.ajustes.push(ajuste)
    contagem.total_itens++
    const qty = Number(ajuste.quantidade)
    if (qty > 0) contagem.total_sobras++
    else if (qty < 0) contagem.total_faltas++
    else contagem.total_zerados++
  }

  return Array.from(map.values()).sort((a, b) => b.data.localeCompare(a.data))
})

const contagensAgrupadasPaginadas = computed(() => {
  const start = (pageHistorico.value - 1) * pageSizeHistorico.value
  const end = start + pageSizeHistorico.value
  return contagensAgrupadas.value.slice(start, end)
})

const toggleContagem = (idx: number) => {
  if (expandedContagens.value.has(idx)) {
    expandedContagens.value.delete(idx)
  } else {
    expandedContagens.value.add(idx)
  }
}

// ==========================================
// MODAIS
// ==========================================
const modalSairOpen = ref(false)
const modalSucessoOpen = ref(false)
const modalExcluirItemOpen = ref(false)
const modalExcluirContagemOpen = ref(false)
const ajusteParaExcluir = ref<Ajuste | null>(null)
const contagemParaExcluir = ref<ContagemHistorico | null>(null)
const excluindo = ref(false)

// ==========================================
// AÇÕES
// ==========================================

const carregarDadosBase = async () => {
  try {
    const [g, s, p] = await Promise.all([
      getGrupos(),
      getSubgrupos(),
      getProdutos()
    ])
    grupos.value = g
    subgrupos.value = s
    produtos.value = p
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar dados', color: 'red' })
  }
}

const carregarHistorico = async () => {
  try {
    loadingHistorico.value = true
    todosAjustes.value = await getAjustes({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar histórico', color: 'red' })
  } finally {
    loadingHistorico.value = false
  }
}

const limparFiltrosHistorico = () => {
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  filtroBusca.value = ''
  carregarHistorico()
}

const abrirModalSetup = () => {
  setupData.value = new Date().toISOString().split('T')[0]
  setupGrupoId.value = ''
  setupSubgrupoId.value = ''
  modalSetupOpen.value = true
}

const iniciarContagem = async () => {
  try {
    loadingSetup.value = true

    // Carrega saldos de todos os produtos de uma vez
    const todosSaldos = await getSaldoEstoque()
    saldos.value = todosSaldos

    // Montar itens de contagem
    const prods = produtosParaContar.value
    itensContagem.value = prods.map(p => {
      const saldo = todosSaldos.find(s => s.produto_id === p.id)
      return {
        produto_id: p.id,
        nome: p.nome,
        unidade_sigla: p.unidade?.sigla || '',
        subgrupo_nome: p.subgrupo?.nome || '',
        saldo_sistema: Number(saldo?.saldo_principal || 0),
        quantidade_contada: null,
        diferenca: null
      }
    }).sort((a, b) => a.nome.localeCompare(b.nome))

    buscaContagem.value = ''
    motivoContagem.value = ''
    apenasComDiferenca.value = true
    modalSetupOpen.value = false
    etapa.value = 'contagem'
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao iniciar contagem', color: 'red' })
  } finally {
    loadingSetup.value = false
  }
}

const confirmarSairContagem = () => {
  if (itensContados.value > 0) {
    modalSairOpen.value = true
  } else {
    etapa.value = 'principal'
  }
}

const descartarContagem = () => {
  modalSairOpen.value = false
  itensContagem.value = []
  etapa.value = 'principal'
}

const abrirRevisao = () => {
  etapa.value = 'revisao'
}

const salvarContagem = async () => {
  if (!motivoContagem.value.trim()) {
    toast.add({ title: 'Atenção', description: 'Informe o motivo/observação da contagem', color: 'yellow' })
    return
  }

  try {
    salvando.value = true

    const ajustesPayload = itensParaSalvar.value.map(item => ({
      produto_id: item.produto_id,
      data: setupData.value,
      quantidade: item.diferenca!,
      motivo: `${motivoContagem.value.trim()} — ${grupoSelecionadoNome}${subgrupoSelecionadoNome ? ' / ' + subgrupoSelecionadoNome : ''}`
    }))

    await createAjustesEmLote(ajustesPayload)

    const sobras = ajustesPayload.filter(a => a.quantidade > 0).length
    const faltas = ajustesPayload.filter(a => a.quantidade < 0).length
    const zeros = ajustesPayload.filter(a => a.quantidade === 0).length

    const parts: string[] = []
    if (sobras > 0) parts.push(`${sobras} ${sobras === 1 ? 'sobra' : 'sobras'}`)
    if (faltas > 0) parts.push(`${faltas} ${faltas === 1 ? 'falta' : 'faltas'}`)
    if (zeros > 0) parts.push(`${zeros} sem diferença`)
    resumoSalvamento.value = `${ajustesPayload.length} ${ajustesPayload.length === 1 ? 'ajuste registrado' : 'ajustes registrados'}: ${parts.join(', ')}.`

    toast.add({ title: 'Sucesso', description: 'Contagem salva com sucesso!', color: 'green' })

    await carregarHistorico()
    etapa.value = 'principal'
    modalSucessoOpen.value = true
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar contagem', color: 'red' })
  } finally {
    salvando.value = false
  }
}

const fecharSucesso = () => {
  modalSucessoOpen.value = false
  itensContagem.value = []
}

const novaContagemAposSucesso = () => {
  modalSucessoOpen.value = false
  itensContagem.value = []
  abrirModalSetup()
}

const confirmarExclusaoItem = (ajuste: Ajuste) => {
  ajusteParaExcluir.value = ajuste
  modalExcluirItemOpen.value = true
}

const excluirItemConfirmado = async () => {
  if (!ajusteParaExcluir.value) return
  try {
    excluindo.value = true
    await removeAjuste(ajusteParaExcluir.value.id)
    toast.add({ title: 'Sucesso', description: 'Ajuste excluído', color: 'green' })
    modalExcluirItemOpen.value = false
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir', color: 'red' })
  } finally {
    excluindo.value = false
  }
}

const confirmarExclusaoContagem = (contagem: ContagemHistorico) => {
  contagemParaExcluir.value = contagem
  modalExcluirContagemOpen.value = true
}

const excluirContagemConfirmada = async () => {
  if (!contagemParaExcluir.value) return
  try {
    excluindo.value = true
    const ids = contagemParaExcluir.value.ajustes.map(a => a.id)
    await deleteAjustesEmLote(ids)
    toast.add({ title: 'Sucesso', description: 'Contagem excluída com todos os ajustes', color: 'green' })
    modalExcluirContagemOpen.value = false
    expandedContagens.value.clear()
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir contagem', color: 'red' })
  } finally {
    excluindo.value = false
  }
}

// ==========================================
// UTILS
// ==========================================

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const formatNumber = (value: number | undefined | null) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(value || 0)
}

// ==========================================
// WATCHERS
// ==========================================
watch([filtroDataInicio, filtroDataFim], () => {
  carregarHistorico()
})

// ==========================================
// INIT
// ==========================================
watch(empresaId, async () => {
  if (empresaId.value) {
    await carregarDadosBase()
    await carregarHistorico()
  }
}, { immediate: true })
</script>
