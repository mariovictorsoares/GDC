<template>
  <div class="space-y-6">
    <!-- ============================================ -->
    <!-- ESTADO: TELA PRINCIPAL (lista de contagens)  -->
    <!-- ============================================ -->
    <template v-if="etapa === 'principal'">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contagem de Estoque</h1>
          <p class="text-sm text-gray-500">Gerencie suas contagens de estoque e inventário</p>
        </div>
        <div class="flex gap-2">
          <UButton color="gray" variant="soft" @click="slideoverSetoresOpen = true">
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4 mr-2" />
            Setores
          </UButton>
          <UButton color="primary" @click="abrirModalSetup">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
            Nova Contagem
          </UButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingContagens" class="space-y-4">
        <UCard :ui="{ body: { padding: '' } }">
          <div class="p-5 space-y-4">
            <div v-for="i in 4" :key="i" class="flex items-center justify-between py-3">
              <div class="flex items-center gap-4">
                <USkeleton class="h-10 w-10 rounded-lg" />
                <div class="space-y-2">
                  <USkeleton class="h-4 w-48" />
                  <USkeleton class="h-3 w-32" />
                </div>
              </div>
              <div class="flex items-center gap-3">
                <USkeleton class="h-6 w-20 rounded-full" />
                <USkeleton class="h-5 w-5 rounded-full" />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty state -->
      <UCard v-else-if="contagensPersistidas.length === 0">
        <div class="flex flex-col items-center justify-center py-16 text-gray-500">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mb-4 text-gray-300" />
          <p class="text-base font-medium">Nenhuma contagem criada</p>
          <p class="text-sm text-gray-400 mt-1 mb-6">Crie uma contagem para organizar e contar seus produtos por setor</p>
          <UButton color="primary" @click="abrirModalSetup">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
            Criar primeira contagem
          </UButton>
        </div>
      </UCard>

      <!-- Lista de contagens -->
      <UCard v-else :ui="{ body: { padding: '' } }">
        <!-- Tabela desktop -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-[28%]"></th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Última contagem</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima contagem</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Recorrência</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Progresso</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="contagem in contagensPersistidasPaginadas"
                :key="contagem.id"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
                @click="abrirDetalhes(contagem)"
              >
                <td class="px-6 py-4">
                  <p class="font-semibold text-gray-900">{{ contagem.nome }}</p>
                </td>
                <td class="px-4 py-4 text-center">
                  <p class="text-xs text-gray-400">Última contagem</p>
                  <p class="font-semibold text-gray-700 text-sm">{{ contagem.ultima_contagem ? formatDate(contagem.ultima_contagem) : '-' }}</p>
                </td>
                <td class="px-4 py-4 text-center">
                  <p class="text-xs text-gray-400">Próxima contagem</p>
                  <p class="font-semibold text-gray-700 text-sm">{{ calcProximaContagem(contagem) }}</p>
                </td>
                <td class="px-4 py-4 text-center">
                  <p class="text-xs text-gray-400">Recorrência</p>
                  <p class="font-semibold text-gray-700 text-sm">{{ labelRecorrencia(contagem.recorrencia) }}</p>
                </td>
                <td class="px-4 py-4 text-center">
                  <p class="text-xs text-gray-400">Progresso</p>
                  <p class="font-bold text-sm" :class="calcProgressoMensal(contagem).feitas >= calcProgressoMensal(contagem).esperadas ? 'text-green-600' : 'text-gray-700'">
                    {{ calcProgressoMensal(contagem).feitas }}/{{ calcProgressoMensal(contagem).esperadas }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards mobile -->
        <div class="sm:hidden divide-y divide-gray-100">
          <div
            v-for="contagem in contagensPersistidasPaginadas"
            :key="'m-' + contagem.id"
            class="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="abrirDetalhes(contagem)"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="font-semibold text-gray-900">{{ contagem.nome }}</p>
              <p class="text-xs font-bold" :class="calcProgressoMensal(contagem).feitas >= calcProgressoMensal(contagem).esperadas ? 'text-green-600' : 'text-gray-700'">
                {{ calcProgressoMensal(contagem).feitas }}/{{ calcProgressoMensal(contagem).esperadas }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div>
                <p class="text-[10px] text-gray-400 uppercase">Próxima</p>
                <p class="text-xs font-semibold text-gray-700">{{ calcProximaContagem(contagem) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 uppercase">Recorrência</p>
                <p class="text-xs font-semibold text-gray-700">{{ labelRecorrencia(contagem.recorrencia) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 uppercase">Progresso</p>
                <p class="text-xs font-bold" :class="calcProgressoMensal(contagem).feitas >= calcProgressoMensal(contagem).esperadas ? 'text-green-600' : 'text-gray-700'">
                  {{ calcProgressoMensal(contagem).feitas }}/{{ calcProgressoMensal(contagem).esperadas }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <TablePagination
          v-if="contagensPersistidas.length > pageSizeContagens"
          v-model="pageContagens"
          :page-size="pageSizeContagens"
          :total-items="contagensPersistidas.length"
          @update:page-size="pageSizeContagens = $event"
        />
      </UCard>

    </template>

    <!-- ============================================ -->
    <!-- ESTADO: DETALHES DE UMA CONTAGEM              -->
    <!-- ============================================ -->
    <template v-if="etapa === 'detalhes' && contagemSelecionada">
      <!-- Header -->
      <div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" class="mb-3" @click="etapa = 'principal'" />
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 class="text-2xl font-bold text-gray-900">{{ contagemSelecionada.nome }}</h1>
          <div class="flex gap-2">
            <UButton
              v-if="contagemSelecionada.status !== 'finalizada'"
              color="red"
              variant="soft"
              size="sm"
              @click="confirmarExclusaoContagemPersistida"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
              Excluir
            </UButton>
            <UButton
              v-if="contagemSelecionada.responsavel_telefone"
              color="green"
              variant="soft"
              size="sm"
              :loading="loadingEnviarWhatsApp"
              @click="enviarLembreteManual"
            >
              <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 mr-1" />
              Enviar Lembrete
            </UButton>
            <UButton
              v-if="contagemSelecionada.status !== 'finalizada'"
              color="primary"
              @click="iniciarContagemDetalhes"
              :loading="loadingIniciar"
            >
              <UIcon name="i-heroicons-play" class="w-4 h-4 mr-2" />
              Iniciar Contagem
            </UButton>
          </div>
        </div>
      </div>

      <!-- Cards de resumo (estilo Alo Chefia) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Card esquerdo: Status + Progresso circular -->
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">Status</p>
              <p
                class="text-lg font-bold"
                :class="{
                  'text-red-500': contagemSelecionada.status === 'atrasada',
                  'text-yellow-600': contagemSelecionada.status === 'aguardando' || contagemSelecionada.status === 'pendente',
                  'text-blue-600': contagemSelecionada.status === 'em_andamento',
                  'text-green-600': contagemSelecionada.status === 'finalizada',
                  'text-gray-500': !contagemSelecionada.status
                }"
              >
                {{ statusLabelTabela(contagemSelecionada.status) }}
              </p>
              <UButton
                v-if="contagemSelecionada.status !== 'finalizada'"
                color="gray"
                variant="soft"
                size="xs"
                class="mt-4"
                @click="iniciarContagemDetalhes"
                :loading="loadingIniciar"
              >
                <UIcon name="i-heroicons-play" class="w-3 h-3 mr-1" />
                Ver Progresso
              </UButton>
            </div>
            <!-- Progresso circular -->
            <div class="relative w-20 h-20 flex-shrink-0">
              <svg class="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" stroke-width="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  :stroke="(contagemSelecionada.progresso || 0) >= 100 ? '#22c55e' : '#3b82f6'"
                  stroke-width="6"
                  stroke-linecap="round"
                  :stroke-dasharray="`${((contagemSelecionada.progresso || 0) / 100) * 213.6} 213.6`"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-lg font-bold text-gray-900">{{ contagemSelecionada.progresso || 0 }}%</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Card central: Recorrência + Responsável -->
        <div class="flex flex-col gap-4">
          <UCard :ui="{ body: { padding: 'p-5' } }">
            <p class="text-sm text-gray-500 mb-1">Recorrência</p>
            <p class="font-semibold text-gray-900">{{ labelRecorrencia(contagemSelecionada.recorrencia) }}</p>
          </UCard>
          <UCard :ui="{ body: { padding: 'p-5' } }">
            <p class="text-sm text-gray-500 mb-1">Responsável</p>
            <p class="font-semibold text-gray-900">{{ contagemSelecionada.responsavel_nome || '-' }}</p>
            <p v-if="contagemSelecionada.responsavel_telefone" class="text-xs text-gray-400">{{ contagemSelecionada.responsavel_telefone }}</p>
          </UCard>
        </div>

        <!-- Card direito: Setores -->
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <p class="text-sm text-gray-500 mb-2">Setores</p>
          <div v-if="(contagemSelecionada.contagem_setores || []).length === 0" class="text-gray-300 text-sm">
            Nenhum setor vinculado
          </div>
          <div v-else class="space-y-1 max-h-[140px] overflow-y-auto">
            <p
              v-for="cs in contagemSelecionada.contagem_setores"
              :key="cs.id"
              class="font-medium text-gray-900 text-sm"
            >
              {{ cs.setor?.nome || 'Setor' }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- Histórico -->
      <UCard :ui="{ body: { padding: '' } }">
        <template #header>
          <div>
            <h3 class="text-lg font-bold text-gray-900">Histórico</h3>
            <p class="text-sm text-gray-500 mt-0.5">Confira o histórico de contagens e veja as movimentações realizadas.</p>
          </div>
        </template>

        <div class="px-6 py-8 text-center text-gray-400">
          <p class="text-sm">Nenhuma contagem finalizada até o momento.</p>
        </div>
      </UCard>
    </template>

    <!-- ============================================ -->
    <!-- ETAPA: CONTAGEM POR SETOR                     -->
    <!-- ============================================ -->
    <template v-if="etapa === 'contagem'">
      <!-- Header com info do setor atual -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" @click="confirmarSairContagem" />
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ setorAtualNome }}</h1>
            <p class="text-sm text-gray-500">
              {{ setupNomeContagem }}
              <span class="mx-1">&middot;</span>
              Setor {{ setorAtualIndex + 1 }} de {{ setoresParaContar.length }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="setorAtualIndex > 0"
            color="gray"
            variant="soft"
            @click="setorAnterior"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
            Setor Anterior
          </UButton>
          <UButton
            v-if="setorAtualIndex < setoresParaContar.length - 1"
            color="primary"
            variant="soft"
            @click="proximoSetor"
          >
            Proximo Setor
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
          </UButton>
          <UButton
            color="primary"
            :disabled="itensContadosTotal === 0"
            @click="abrirRevisao"
          >
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-2" />
            Finalizar
          </UButton>
        </div>
      </div>

      <!-- Barra de progresso -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Progresso</span>
          <span class="text-sm font-bold" :class="itensContadosSetor === itensContagemSetor.length ? 'text-green-600' : 'text-blue-600'">
            {{ itensContadosSetor }} de {{ itensContagemSetor.length }} produtos
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-300"
            :class="itensContadosSetor === itensContagemSetor.length ? 'bg-green-500' : 'bg-blue-500'"
            :style="{ width: progressoPercentSetor + '%' }"
          />
        </div>
      </div>

      <!-- Tabs de setores -->
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="(setor, idx) in setoresParaContar"
          :key="setor.id"
          class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
          :class="idx === setorAtualIndex
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="irParaSetor(idx)"
        >
          {{ setor.nome }}
          <span
            v-if="contagemPorSetor[setor.id]?.contados > 0"
            class="ml-1 text-xs opacity-75"
          >
            ({{ contagemPorSetor[setor.id]?.contados || 0 }}/{{ contagemPorSetor[setor.id]?.total || 0 }})
          </span>
        </button>
      </div>

      <!-- Busca -->
      <UInput
        v-model="buscaContagem"
        placeholder="Buscar produto..."
        icon="i-heroicons-magnifying-glass"
        size="lg"
      />

      <!-- Lista de produtos do setor atual -->
      <UCard :ui="{ body: { padding: '' } }">
        <div class="divide-y divide-gray-100">
          <div
            v-for="(item, i) in itensContagemSetorFiltrados"
            :key="item.produto_id"
            class="px-4 sm:px-6 py-3"
          >
            <!-- Layout simples: Nome + Unidade + Input -->
            <div class="flex items-center gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{{ item.nome }}</p>
                <p class="text-xs text-gray-400">{{ item.unidade_sigla }}</p>
              </div>
              <div class="w-36 sm:w-44">
                <UInput
                  :model-value="item.quantidade_contada"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Qtd."
                  size="sm"
                  :ui="{ base: 'text-center font-mono text-base' }"
                  @update:model-value="atualizarContagem(item.produto_id, $event)"
                  @keydown.enter="focarProximo(i)"
                  :ref="(el: any) => setInputRef(i, el)"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="itensContagemSetorFiltrados.length === 0 && buscaContagem" class="flex flex-col items-center justify-center py-8 text-gray-500">
          <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mb-2" />
          <p class="text-sm">Nenhum produto encontrado para "{{ buscaContagem }}"</p>
        </div>

        <div v-if="itensContagemSetorFiltrados.length === 0 && !buscaContagem" class="flex flex-col items-center justify-center py-8 text-gray-500">
          <UIcon name="i-heroicons-cube" class="w-8 h-8 mb-2" />
          <p class="text-sm">Nenhum produto neste setor</p>
        </div>
      </UCard>
    </template>

    <!-- ============================================ -->
    <!-- ETAPA: REVISAO E CONFIRMACAO                  -->
    <!-- ============================================ -->
    <template v-if="etapa === 'revisao'">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" @click="etapa = 'contagem'" />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-gray-900">Revisao da Contagem</h1>
            </div>
            <p class="text-sm text-gray-500">{{ setupNomeContagem }} — {{ formatDate(setupData) }}</p>
          </div>
        </div>

        <!-- Cards de resumo -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-blue-600">{{ itensContadosTotal }}</p>
              <p class="text-xs text-gray-500 mt-1">Contados</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-gray-400">{{ itensNaoContadosTotal }}</p>
              <p class="text-xs text-gray-500 mt-1">Nao contados</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-green-600">{{ itensComSobraTotal }}</p>
              <p class="text-xs text-gray-500 mt-1">Sobras</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-red-600">{{ itensComFaltaTotal }}</p>
              <p class="text-xs text-gray-500 mt-1">Faltas</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p
                class="text-2xl font-bold"
                :class="valorTotalDivergenciaContagem >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ valorTotalDivergenciaContagem >= 0 ? '+' : '' }}{{ formatCurrency(valorTotalDivergenciaContagem) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">Impacto (R$)</p>
            </div>
          </UCard>
        </div>

        <!-- Tabela de divergencias -->
        <UCard v-if="todosItensComDiferenca.length > 0">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Divergencias encontradas</h3>
              <span class="text-sm text-gray-500">{{ todosItensComDiferenca.length }} itens</span>
            </div>
          </template>

          <div class="overflow-x-auto -mx-4 sm:-mx-6">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b border-gray-200">
                  <th class="px-4 sm:px-6 pb-3 font-medium">Produto</th>
                  <th class="px-2 pb-3 font-medium text-right">Sistema</th>
                  <th class="px-2 pb-3 font-medium text-right">Contado</th>
                  <th class="px-2 pb-3 font-medium text-right">Diferenca</th>
                  <th class="px-4 sm:px-6 pb-3 font-medium text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in todosItensComDiferenca"
                  :key="item.produto_id"
                  class="border-b border-gray-100 last:border-0"
                  :class="item.diferenca! > 0 ? 'bg-green-50/40' : 'bg-red-50/40'"
                >
                  <td class="px-4 sm:px-6 py-3">
                    <p class="font-medium text-gray-900">{{ item.nome }}</p>
                    <p class="text-xs text-gray-500">{{ item.subgrupo_nome }}</p>
                  </td>
                  <td class="px-2 py-3 text-right font-mono text-gray-600">
                    {{ formatNumber(item.saldo_sistema) }}
                  </td>
                  <td class="px-2 py-3 text-right font-mono text-gray-900 font-semibold">
                    {{ formatNumber(item.quantidade_contada) }}
                  </td>
                  <td class="px-2 py-3 text-right">
                    <span
                      class="font-bold font-mono"
                      :class="item.diferenca! > 0 ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ item.diferenca! > 0 ? '+' : '' }}{{ formatNumber(item.diferenca) }} {{ item.unidade_sigla }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-3 text-right">
                    <span
                      class="font-semibold font-mono"
                      :class="item.valor_divergencia! > 0 ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ item.valor_divergencia! > 0 ? '+' : '' }}{{ formatCurrency(item.valor_divergencia || 0) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <!-- Sem divergencia -->
        <UCard v-if="todosItensComDiferenca.length === 0 && itensContadosTotal > 0">
          <div class="text-center py-6 text-gray-500">
            <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-green-500 mb-2 mx-auto" />
            <p class="font-medium">Nenhuma divergencia encontrada!</p>
          </div>
        </UCard>

        <!-- Motivo -->
        <UCard>
          <UFormGroup label="Observacao / Motivo da Contagem" required>
            <UTextarea
              v-model="motivoContagem"
              placeholder="Ex: Contagem semanal de rotina, Inventario mensal..."
              rows="3"
            />
          </UFormGroup>

          <div class="mt-4">
            <UCheckbox
              v-model="apenasComDiferenca"
              label="Salvar apenas produtos com divergencia"
            />
            <p class="text-xs text-gray-500 ml-6 mt-1">
              Se desmarcado, salva todos os produtos contados (inclusive os sem divergencia, com ajuste zero)
            </p>
          </div>
        </UCard>

        <!-- Botoes -->
        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="etapa = 'contagem'">
            Voltar para Contagem
          </UButton>
          <UButton
            color="primary"
            :loading="salvando"
            :disabled="!motivoContagem.trim() || itensContadosTotal === 0"
            @click="salvarContagem"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
            Confirmar e Salvar ({{ itensParaSalvar.length }} {{ itensParaSalvar.length === 1 ? 'ajuste' : 'ajustes' }})
          </UButton>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- SLIDEOVERS E MODAIS                           -->
    <!-- ============================================ -->

    <!-- Slideover: Gerenciar Setores -->
    <USlideover
      v-model="slideoverSetoresOpen"
      :ui="{
        width: 'max-w-2xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800'
      }"
      @close="voltarListaSetores"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <template v-if="setorSelecionado">
              <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="xs" @click="voltarListaSetores" />
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ setorSelecionado.nome }}</h3>
                <p class="text-xs text-gray-500">Gerencie os produtos deste setor</p>
              </div>
            </template>
            <template v-else>
              <div class="p-2 bg-blue-100 rounded-lg">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Setores</h3>
                <p class="text-xs text-gray-500">Organize suas contagens por area/setor</p>
              </div>
            </template>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="slideoverSetoresOpen = false" />
        </div>

        <!-- TELA 1: Lista de Setores -->
        <div v-if="!setorSelecionado" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div class="flex gap-2">
            <UInput
              v-model="novoSetorNome"
              placeholder="Nome do novo setor..."
              class="flex-1"
              @keydown.enter="adicionarSetor"
            />
            <UButton color="primary" :loading="salvandoSetor" :disabled="!novoSetorNome.trim()" @click="adicionarSetor">
              <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            </UButton>
          </div>

          <div v-if="setores.length === 0" class="text-center py-12 text-gray-500">
            <UIcon name="i-heroicons-map-pin" class="w-10 h-10 mb-3 mx-auto text-gray-300" />
            <p class="text-sm font-medium">Nenhum setor cadastrado</p>
            <p class="text-xs text-gray-400 mt-1">Ex: Camara Fria, Estoque Seco, Bar, Cozinha</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="setor in setores"
              :key="setor.id"
              class="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all cursor-pointer group"
              @click="selecionarSetor(setor)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                  <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <span class="font-medium text-gray-900">{{ setor.nome }}</span>
                  <p class="text-xs text-gray-400">{{ setorProdutosCount[setor.id] || 0 }} {{ (setorProdutosCount[setor.id] || 0) === 1 ? 'produto' : 'produtos' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  :loading="deletandoSetorId === setor.id"
                  @click.stop="confirmarRemoverSetor(setor)"
                />
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- TELA 2: Produtos do Setor (duas colunas) -->
        <div v-else class="flex-1 overflow-hidden flex flex-col">
          <div v-if="loadingSetorProdutos" class="flex-1 flex items-center justify-center">
            <div class="text-center space-y-3">
              <USkeleton class="h-6 w-40 mx-auto" />
              <USkeleton class="h-4 w-28 mx-auto" />
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col sm:flex-row overflow-hidden">
            <!-- Coluna ESQUERDA: Produtos disponiveis -->
            <div class="sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-200 overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adicionar Produtos</p>
                  <UButton
                    v-if="produtosDisponiveis.length > 0"
                    color="primary"
                    variant="soft"
                    size="xs"
                    :loading="adicionandoProdutos"
                    @click="adicionarTodosVisiveis"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
                    Todos ({{ produtosDisponiveis.length }})
                  </UButton>
                </div>
                <USelect
                  v-model="filtroGrupoSetor"
                  :options="[{ label: 'Todos os grupos', value: '' }, ...grupos.map(g => ({ label: g.nome, value: g.id }))]"
                  size="xs"
                />
                <USelect
                  v-if="filtroGrupoSetor"
                  v-model="filtroSubgrupoSetor"
                  :options="[{ label: 'Todos os subgrupos', value: '' }, ...subgruposFiltroSetor.map(s => ({ label: s.nome, value: s.id }))]"
                  size="xs"
                />
                <UInput
                  v-model="buscaProdutoSetor"
                  placeholder="Buscar produto..."
                  icon="i-heroicons-magnifying-glass"
                  size="xs"
                />
              </div>

              <div class="flex-1 overflow-y-auto">
                <div v-if="produtosDisponiveis.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400">
                  <UIcon name="i-heroicons-check-circle" class="w-8 h-8 mb-2 text-green-400" />
                  <p class="text-sm">{{ buscaProdutoSetor || filtroGrupoSetor ? 'Nenhum produto encontrado' : 'Todos vinculados' }}</p>
                </div>

                <div v-else class="divide-y divide-gray-50">
                  <div
                    v-for="prod in produtosDisponiveis.slice(0, 100)"
                    :key="prod.id"
                    class="flex items-center justify-between px-4 py-2 hover:bg-green-50 transition-colors cursor-pointer group"
                    @click="adicionarProdutoAoSetor(prod.id)"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-700 truncate">{{ prod.nome }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ prod.subgrupo?.grupo?.nome }} / {{ prod.subgrupo?.nome }}</p>
                    </div>
                    <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0 ml-2" />
                  </div>
                  <p v-if="produtosDisponiveis.length > 100" class="text-xs text-gray-400 text-center py-3">
                    Mostrando 100 de {{ produtosDisponiveis.length }} — filtre para ver mais
                  </p>
                </div>
              </div>
            </div>

            <!-- Coluna DIREITA: Produtos vinculados -->
            <div class="sm:w-1/2 flex flex-col overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vinculados ({{ setorProdutos.length }})
                  </p>
                  <UButton
                    v-if="setorProdutos.length > 0"
                    color="red"
                    variant="ghost"
                    size="xs"
                    :loading="adicionandoProdutos"
                    @click="removerTodosProdutosDoSetor"
                  >
                    Remover todos
                  </UButton>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto">
                <div v-if="setorProdutos.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400">
                  <UIcon name="i-heroicons-cube" class="w-8 h-8 mb-2" />
                  <p class="text-sm">Nenhum produto vinculado</p>
                  <p class="text-xs mt-1">Clique nos produtos ao lado para adicionar</p>
                </div>

                <div v-else class="divide-y divide-gray-50">
                  <div
                    v-for="sp in setorProdutos"
                    :key="sp.id"
                    class="flex items-center justify-between px-4 py-2 hover:bg-red-50 transition-colors group"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ sp.produto?.nome }}</p>
                      <p class="text-xs text-gray-500 truncate">{{ sp.produto?.subgrupo?.grupo?.nome }} / {{ sp.produto?.subgrupo?.nome }}</p>
                    </div>
                    <UButton
                      color="red"
                      variant="ghost"
                      icon="i-heroicons-x-mark"
                      size="xs"
                      class="opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="removerProdutoDoSetor(sp.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Slideover: Nova Contagem -->
    <USlideover
      v-model="slideoverSetupOpen"
      :ui="{
        width: 'max-w-xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800'
      }"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Nova Contagem</h3>
              <p class="text-xs text-gray-500">Configure e selecione os setores para contar</p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="slideoverSetupOpen = false" />
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <UFormGroup label="Nome da Contagem" required>
            <UInput v-model="setupNomeContagem" placeholder="Ex: Contagem semanal de bebidas" />
          </UFormGroup>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup label="Data da Contagem" required>
              <UInput v-model="setupData" type="date" />
            </UFormGroup>

            <UFormGroup label="Recorrência" required>
              <USelect
                v-model="setupRecorrencia"
                :options="opcoesRecorrencia"
                option-attribute="label"
                value-attribute="value"
              />
            </UFormGroup>
          </div>

          <!-- Campos dinâmicos de recorrência -->
          <template v-if="setupRecorrencia && setupRecorrencia !== 'nenhuma'">

            <!-- Diária: horário -->
            <UFormGroup v-if="setupRecorrencia === 'diaria'" label="Horário da Notificação" required>
              <USelect
                v-model="setupHorarioNotificacao"
                :options="opcoesHorario"
                option-attribute="label"
                value-attribute="value"
              />
            </UFormGroup>

            <!-- Semanal / Quinzenal: dias da semana -->
            <div v-if="setupRecorrencia === 'semanal' || setupRecorrencia === 'quinzenal'">
              <UFormGroup label="Dias em que ocorre" required>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="dia in diasDaSemana"
                    :key="dia.value"
                    class="px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all min-w-[52px] text-center"
                    :class="setupDiasSemana.has(dia.value)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'"
                    @click="toggleDiaSemana(dia.value)"
                  >
                    {{ dia.label }}
                  </button>
                </div>
              </UFormGroup>

              <UFormGroup label="Horário da Notificação" required class="mt-4">
                <USelect
                  v-model="setupHorarioNotificacao"
                  :options="opcoesHorario"
                  option-attribute="label"
                  value-attribute="value"
                />
              </UFormGroup>
            </div>

            <!-- Mensal: ocorrência + horário -->
            <template v-if="setupRecorrencia === 'mensal'">
              <UFormGroup label="Ocorre em" required>
                <div class="grid grid-cols-2 gap-3">
                  <USelect
                    v-model="setupMensalPosicao"
                    :options="opcoesMensalPosicao"
                    option-attribute="label"
                    value-attribute="value"
                  />
                  <USelect
                    v-model="setupMensalDia"
                    :options="opcoesMensalDia"
                    option-attribute="label"
                    value-attribute="value"
                  />
                </div>
              </UFormGroup>

              <UFormGroup label="Horário da Notificação" required>
                <USelect
                  v-model="setupHorarioNotificacao"
                  :options="opcoesHorario"
                  option-attribute="label"
                  value-attribute="value"
                />
              </UFormGroup>
            </template>

            <!-- Texto helper sobre notificação -->
            <p class="text-xs text-gray-400 -mt-2">
              Nos dias e horário definidos, o responsável receberá uma notificação para realizar a contagem.
            </p>
          </template>

          <!-- Responsável — inline com chips -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-1">Responsável</h4>
            <p class="text-sm text-gray-500 mb-3">Quem vai realizar esta contagem?</p>

            <!-- Formulário inline para adicionar (acima da lista) -->
            <div class="flex items-end gap-2 mb-3">
              <div class="flex-1 grid grid-cols-2 gap-2">
                <UInput
                  v-model="novoResponsavelNome"
                  placeholder="Nome"
                  size="sm"
                  icon="i-heroicons-user"
                  @keydown.enter="adicionarResponsavel"
                />
                <UInput
                  v-model="novoResponsavelTelefone"
                  placeholder="Telefone"
                  size="sm"
                  icon="i-heroicons-phone"
                  @keydown.enter="adicionarResponsavel"
                />
              </div>
              <UButton
                color="gray"
                variant="solid"
                size="sm"
                :disabled="!novoResponsavelNome.trim() || !novoResponsavelTelefone.trim()"
                @click="adicionarResponsavel"
              >
                <UIcon name="i-heroicons-plus" class="w-4 h-4" />
              </UButton>
            </div>

            <!-- Chips dos responsáveis existentes -->
            <div v-if="responsaveis.length > 0" class="flex flex-wrap gap-2">
              <button
                v-for="resp in responsaveis"
                :key="resp.nome + resp.telefone"
                class="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm transition-all border"
                :class="setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'"
                @click="setupResponsavel = (setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone) ? null : resp"
              >
                <span
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                  :class="setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'"
                >
                  {{ resp.nome.charAt(0) }}
                </span>
                <span class="font-medium">{{ resp.nome }}</span>
                <span class="text-xs opacity-60">{{ resp.telefone }}</span>
                <UIcon
                  v-if="setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone"
                  name="i-heroicons-check-circle-solid"
                  class="w-4 h-4 text-emerald-500"
                />
              </button>
            </div>
          </div>

          <div class="border-t border-gray-200" />

          <!-- Setores — estilo checklist compacto -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-semibold text-gray-900">Setores</h4>
              <span v-if="setupSetoresSelecionados.size > 0" class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {{ setupSetoresSelecionados.size }}/{{ setores.length }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mb-3">Marque os setores que farao parte desta contagem.</p>

            <UInput
              v-if="setores.length > 5"
              v-model="setupBuscaSetor"
              placeholder="Filtrar setores..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
              class="mb-3"
            />

            <div v-if="setoresFiltradosSetup.length === 0" class="text-center py-6 text-gray-400">
              <UIcon name="i-heroicons-map-pin" class="w-8 h-8 mb-2 mx-auto" />
              <p class="text-sm font-medium">Nenhum setor encontrado</p>
              <p class="text-xs mt-1">Crie setores na tela principal antes de criar uma contagem</p>
            </div>

            <div v-else class="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <label
                v-for="setor in setoresFiltradosSetup"
                :key="setor.id"
                class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                :class="setupSetoresSelecionados.has(setor.id) ? 'bg-emerald-50/60' : 'hover:bg-gray-50'"
              >
                <div
                  class="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all"
                  :class="setupSetoresSelecionados.has(setor.id)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-300 bg-white'"
                  @click.prevent="toggleSetorSelecionado(setor.id)"
                >
                  <UIcon v-if="setupSetoresSelecionados.has(setor.id)" name="i-heroicons-check" class="w-3.5 h-3.5 text-white" />
                </div>
                <div class="flex-1 min-w-0" @click.prevent="toggleSetorSelecionado(setor.id)">
                  <p class="text-sm font-medium text-gray-900">{{ setor.nome }}</p>
                </div>
                <span class="text-xs text-gray-400 tabular-nums flex-shrink-0">
                  {{ (setorProdutosPorSetor[setor.id] || []).length }} {{ (setorProdutosPorSetor[setor.id] || []).length === 1 ? 'produto' : 'produtos' }}
                </span>
              </label>
            </div>

            <!-- Botão selecionar/desmarcar todos -->
            <div v-if="setoresFiltradosSetup.length > 1" class="mt-2 flex justify-end">
              <button
                class="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                @click="setupSetoresSelecionados.size === setoresFiltradosSetup.length ? setupSetoresSelecionados = new Set() : setupSetoresSelecionados = new Set(setoresFiltradosSetup.map(s => s.id))"
              >
                {{ setupSetoresSelecionados.size === setoresFiltradosSetup.length ? 'Desmarcar todos' : 'Selecionar todos' }}
              </button>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="slideoverSetupOpen = false">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :disabled="!setupNomeContagem.trim() || !setupRecorrencia || !setupResponsavel || setupSetoresSelecionados.size === 0"
              :loading="loadingSetup"
              @click="criarContagemPersistida"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              Criar Contagem
            </UButton>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Modal: Sair da contagem -->
    <UModal v-model="modalSairOpen" :ui="{ overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-gray-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-yellow-700">Sair da contagem?</h3>
        </template>
        <p>Voce tem <strong>{{ itensContadosTotal }}</strong> {{ itensContadosTotal === 1 ? 'produto contado' : 'produtos contados' }}. Se sair agora, todos os dados serao perdidos.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalSairOpen = false">Continuar contando</UButton>
            <UButton color="red" class="w-full sm:w-auto" @click="descartarContagem">Descartar e sair</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Sucesso -->
    <UModal v-model="modalSucessoOpen" :ui="{ overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-gray-100' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold">Contagem salva!</h3>
          </div>
        </template>
        <p>{{ resumoSalvamento }}</p>
        <template #footer>
          <div class="flex justify-end">
            <UButton color="primary" @click="fecharSucesso">OK</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Excluir item individual -->
    <UModal v-model="modalExcluirItemOpen" :ui="{ overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-gray-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Ajuste</h3>
        </template>
        <p>Tem certeza que deseja excluir o ajuste de <strong>{{ ajusteParaExcluir?.produto?.nome }}</strong>?</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirItemOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirItemConfirmado">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Excluir contagem historico -->
    <UModal v-model="modalExcluirContagemOpen" :ui="{ overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-gray-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Contagem</h3>
        </template>
        <p>Tem certeza que deseja excluir <strong>todos os {{ contagemHistoricoParaExcluir?.total_itens }} ajustes</strong> desta contagem?</p>
        <p class="text-sm text-red-500 mt-2">Esta acao nao pode ser desfeita.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirContagemOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirContagemConfirmada">Excluir tudo</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Confirmar exclusao de Setor -->
    <UModal v-model="modalConfirmarExclusaoSetorOpen" :ui="{ overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-gray-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Setor</h3>
        </template>
        <p>Tem certeza que deseja excluir o setor <strong>{{ setorParaExcluir?.nome }}</strong>?</p>
        <p v-if="setorParaExcluir && (setorProdutosCount[setorParaExcluir.id] || 0) > 0" class="text-sm text-red-500 mt-2">
          Este setor possui {{ setorProdutosCount[setorParaExcluir.id] }} {{ (setorProdutosCount[setorParaExcluir.id] || 0) === 1 ? 'produto vinculado' : 'produtos vinculados' }} que tambem serao removidos.
        </p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalConfirmarExclusaoSetorOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletandoSetorId === setorParaExcluir?.id" @click="removerSetorConfirmado">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Excluir contagem persistida -->
    <UModal v-model="modalExcluirContagemPersistidaOpen" :ui="{ overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-gray-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Contagem</h3>
        </template>
        <p>Tem certeza que deseja excluir a contagem <strong>{{ contagemSelecionada?.nome }}</strong>?</p>
        <p class="text-sm text-red-500 mt-2">Esta acao nao pode ser desfeita.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirContagemPersistidaOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirContagemPersistidaConfirmada">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Ajuste, Produto, Grupo, Subgrupo, Setor, SetorProduto, SaldoEstoque, ContagemItem, ContagemHistorico, TipoContagem, Contagem } from '~/types'

const toast = useToast()
const {
  getGrupos, getSubgrupos, getProdutos,
  getSaldoEstoque,
  getAjustes, createAjustesEmLote, deleteAjuste: removeAjuste, deleteAjustesEmLote,
  getSetores, createSetor, deleteSetor,
  getSetorProdutos, addProdutosToSetor, removeProdutoFromSetor, countSetorProdutos, getAllSetorProdutos,
  getContagens, createContagem, updateContagemStatus, deleteContagem,
  getResponsaveis, createResponsavel
} = useEstoque()
const { empresaId } = useEmpresa()

// ==========================================
// ESTADO GERAL
// ==========================================
type Etapa = 'principal' | 'detalhes' | 'contagem' | 'revisao'
const etapa = ref<Etapa>('principal')

// ==========================================
// DADOS BASE
// ==========================================
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const produtos = ref<Produto[]>([])
const saldos = ref<SaldoEstoque[]>([])
const todosAjustes = ref<Ajuste[]>([])
const setores = ref<Setor[]>([])

// ==========================================
// CONTAGENS PERSISTIDAS
// ==========================================
const contagensPersistidas = ref<Contagem[]>([])
const loadingContagens = ref(true)
const pageContagens = ref(1)
const pageSizeContagens = ref(10)
const contagemSelecionada = ref<Contagem | null>(null)

const contagensPersistidasPaginadas = computed(() => {
  const start = (pageContagens.value - 1) * pageSizeContagens.value
  return contagensPersistidas.value.slice(start, start + pageSizeContagens.value)
})

// Dados para a tela de detalhes
const detalhesSetorProdutos = ref<Record<string, { id: string; nome: string }[]>>({})
const detalhesSetorProdutosCount = ref<Record<string, number>>({})
const loadingIniciar = ref(false)
const loadingEnviarWhatsApp = ref(false)

const enviarLembreteManual = async () => {
  if (!contagemSelecionada.value) return
  const c = contagemSelecionada.value
  if (!c.responsavel_telefone || !c.responsavel_nome) {
    toast.add({ title: 'Aviso', description: 'Esta contagem não possui responsável com telefone cadastrado.', color: 'yellow' })
    return
  }

  try {
    loadingEnviarWhatsApp.value = true

    // Montar nomes dos setores
    const setoresNomes = (c.contagem_setores || [])
      .map((cs: any) => cs.setor?.nome)
      .filter(Boolean)

    // Montar mensagem no mesmo formato do cron
    const recLabels: Record<string, string> = { diaria: 'Diária', semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal' }
    const setoresTexto = setoresNomes.length > 0
      ? setoresNomes.map((s: string) => `  • ${s}`).join('\n')
      : '  • Todos os setores'

    const mensagem = [
      `📋 *Lembrete de Contagem*`,
      ``,
      `Olá, *${c.responsavel_nome}*!`,
      `Está na hora de realizar a contagem:`,
      ``,
      `📌 *${c.nome}*`,
      `🔄 Recorrência: ${recLabels[c.recorrencia || ''] || c.recorrencia || 'Nenhuma'}`,
      `⏰ Horário: ${c.horario_notificacao || '07:00'}`,
      ``,
      `📍 *Setores:*`,
      setoresTexto,
      ``,
      `👉 *Acesse e inicie a contagem:*`,
      `https://gdcnew.vercel.app/movimentos/ajustes`
    ].join('\n')

    await $fetch('/api/whatsapp/enviar', {
      method: 'POST',
      body: { phone: c.responsavel_telefone, message: mensagem }
    })

    toast.add({ title: 'Enviado!', description: `Lembrete enviado para ${c.responsavel_nome} via WhatsApp`, color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro ao enviar', description: error?.data?.message || error.message || 'Erro ao enviar WhatsApp', color: 'red' })
  } finally {
    loadingEnviarWhatsApp.value = false
  }
}

// ==========================================
// SETORES (Slideover)
// ==========================================
const slideoverSetoresOpen = ref(false)
const novoSetorNome = ref('')
const salvandoSetor = ref(false)
const deletandoSetorId = ref<string | null>(null)
const setorProdutosCount = ref<Record<string, number>>({})
const modalConfirmarExclusaoSetorOpen = ref(false)
const setorParaExcluir = ref<Setor | null>(null)

const setorSelecionado = ref<Setor | null>(null)
const setorProdutos = ref<SetorProduto[]>([])
const loadingSetorProdutos = ref(false)
const buscaProdutoSetor = ref('')
const adicionandoProdutos = ref(false)
const filtroGrupoSetor = ref('')
const filtroSubgrupoSetor = ref('')

const subgruposFiltroSetor = computed(() => {
  if (!filtroGrupoSetor.value) return []
  return subgrupos.value.filter(s => s.grupo_id === filtroGrupoSetor.value)
})

watch(filtroGrupoSetor, () => {
  filtroSubgrupoSetor.value = ''
})

const produtosDisponiveis = computed(() => {
  const idsVinculados = new Set(setorProdutos.value.map(sp => sp.produto_id))
  let lista = produtos.value.filter(p => !idsVinculados.has(p.id))

  if (filtroGrupoSetor.value) {
    lista = lista.filter(p => {
      const sub = subgrupos.value.find(s => s.id === p.subgrupo_id)
      return sub?.grupo_id === filtroGrupoSetor.value
    })
  }

  if (filtroSubgrupoSetor.value) {
    lista = lista.filter(p => p.subgrupo_id === filtroSubgrupoSetor.value)
  }

  if (buscaProdutoSetor.value) {
    const term = buscaProdutoSetor.value.toLowerCase()
    lista = lista.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.subgrupo?.nome?.toLowerCase().includes(term) ||
      p.subgrupo?.grupo?.nome?.toLowerCase().includes(term)
    )
  }
  return lista
})

const selecionarSetor = async (setor: Setor) => {
  setorSelecionado.value = setor
  buscaProdutoSetor.value = ''
  filtroGrupoSetor.value = ''
  filtroSubgrupoSetor.value = ''
  try {
    loadingSetorProdutos.value = true
    setorProdutos.value = await getSetorProdutos(setor.id)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar produtos do setor', color: 'red' })
  } finally {
    loadingSetorProdutos.value = false
  }
}

const voltarListaSetores = async () => {
  setorSelecionado.value = null
  setorProdutos.value = []
  buscaProdutoSetor.value = ''
  filtroGrupoSetor.value = ''
  filtroSubgrupoSetor.value = ''
  try { setorProdutosCount.value = await countSetorProdutos() } catch {}
}

const adicionarSetor = async () => {
  if (!novoSetorNome.value.trim()) return
  try {
    salvandoSetor.value = true
    const setor = await createSetor({ nome: novoSetorNome.value.trim() })
    setores.value.push(setor)
    setores.value.sort((a, b) => a.nome.localeCompare(b.nome))
    novoSetorNome.value = ''
    setorProdutosCount.value[setor.id] = 0
    toast.add({ title: 'Sucesso', description: 'Setor criado', color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao criar setor', color: 'red' })
  } finally {
    salvandoSetor.value = false
  }
}

const confirmarRemoverSetor = (setor: Setor) => {
  setorParaExcluir.value = setor
  modalConfirmarExclusaoSetorOpen.value = true
}

const removerSetorConfirmado = async () => {
  if (!setorParaExcluir.value) return
  const id = setorParaExcluir.value.id
  try {
    deletandoSetorId.value = id
    await deleteSetor(id)
    setores.value = setores.value.filter(s => s.id !== id)
    delete setorProdutosCount.value[id]
    if (setorSelecionado.value?.id === id) {
      setorSelecionado.value = null
      setorProdutos.value = []
    }
    modalConfirmarExclusaoSetorOpen.value = false
    toast.add({ title: 'Sucesso', description: 'Setor excluido', color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir setor', color: 'red' })
  } finally {
    deletandoSetorId.value = null
  }
}

const adicionarProdutoAoSetor = async (produtoId: string) => {
  if (!setorSelecionado.value) return
  try {
    adicionandoProdutos.value = true
    const novos = await addProdutosToSetor(setorSelecionado.value.id, [produtoId])
    setorProdutos.value.push(...novos)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao vincular produto', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}

const adicionarTodosVisiveis = async () => {
  if (!setorSelecionado.value || produtosDisponiveis.value.length === 0) return
  try {
    adicionandoProdutos.value = true
    const ids = produtosDisponiveis.value.map(p => p.id)
    const novos = await addProdutosToSetor(setorSelecionado.value.id, ids)
    setorProdutos.value.push(...novos)
    toast.add({ title: 'Sucesso', description: `${novos.length} produtos adicionados`, color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao vincular produtos', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}

const removerProdutoDoSetor = async (setorProdutoId: string) => {
  try {
    await removeProdutoFromSetor(setorProdutoId)
    setorProdutos.value = setorProdutos.value.filter(sp => sp.id !== setorProdutoId)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao desvincular produto', color: 'red' })
  }
}

const removerTodosProdutosDoSetor = async () => {
  if (setorProdutos.value.length === 0) return
  try {
    adicionandoProdutos.value = true
    for (const sp of setorProdutos.value) {
      await removeProdutoFromSetor(sp.id)
    }
    setorProdutos.value = []
    toast.add({ title: 'Sucesso', description: 'Todos os produtos removidos', color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao remover produtos', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}

// ==========================================
// SETUP NOVA CONTAGEM (Modal)
// ==========================================
const slideoverSetupOpen = ref(false)
const setupNomeContagem = ref('')
const setupData = ref(new Date().toISOString().split('T')[0])
const setupRecorrencia = ref('nenhuma')
const setupResponsavel = ref<{ nome: string; telefone: string } | null>(null)
const loadingSetup = ref(false)
const setupSetoresSelecionados = ref<Set<string>>(new Set())
const setupBuscaSetor = ref('')

const opcoesRecorrencia = [
  { label: 'Não definida', value: 'nenhuma' },
  { label: 'Diária', value: 'diaria' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'A cada duas semanas', value: 'quinzenal' },
  { label: 'Mensal', value: 'mensal' }
]

// Campos dinâmicos de recorrência
const setupHorarioNotificacao = ref('07:00')
const setupDiasSemana = ref<Set<string>>(new Set())
const setupMensalPosicao = ref('primeira')
const setupMensalDia = ref('segunda')

const opcoesHorario = Array.from({ length: 16 }, (_, i) => {
  const h = i + 5
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: label }
})

const diasDaSemana = [
  { label: 'SEG', value: 'seg' },
  { label: 'TER', value: 'ter' },
  { label: 'QUA', value: 'qua' },
  { label: 'QUI', value: 'qui' },
  { label: 'SEX', value: 'sex' },
  { label: 'SÁB', value: 'sab' },
  { label: 'DOM', value: 'dom' }
]

const toggleDiaSemana = (dia: string) => {
  const novo = new Set(setupDiasSemana.value)
  if (novo.has(dia)) {
    novo.delete(dia)
  } else {
    novo.add(dia)
  }
  setupDiasSemana.value = novo
}

const opcoesMensalPosicao = [
  { label: 'Primeira(o)', value: 'primeira' },
  { label: 'Última(o)', value: 'ultima' }
]

const opcoesMensalDia = [
  { label: 'domingo do mês', value: 'domingo' },
  { label: 'segunda-feira do mês', value: 'segunda' },
  { label: 'terça-feira do mês', value: 'terca' },
  { label: 'quarta-feira do mês', value: 'quarta' },
  { label: 'quinta-feira do mês', value: 'quinta' },
  { label: 'sexta-feira do mês', value: 'sexta' },
  { label: 'sábado do mês', value: 'sabado' },
  { label: 'dia do mês', value: 'dia' }
]

// Resetar campos dinâmicos quando muda a recorrência
watch(() => setupRecorrencia.value, () => {
  setupHorarioNotificacao.value = '07:00'
  setupDiasSemana.value = new Set()
  setupMensalPosicao.value = 'primeira'
  setupMensalDia.value = 'segunda'
})

// Responsáveis
const responsaveis = ref<{ id?: string; nome: string; telefone: string }[]>([])
const novoResponsavelNome = ref('')
const novoResponsavelTelefone = ref('')
const loadingResponsaveis = ref(false)

const carregarResponsaveis = async () => {
  try {
    loadingResponsaveis.value = true
    const data = await getResponsaveis()
    responsaveis.value = data
  } catch (error: any) {
    console.error('Erro ao carregar responsáveis:', error.message)
  } finally {
    loadingResponsaveis.value = false
  }
}

const adicionarResponsavel = async () => {
  if (!novoResponsavelNome.value.trim() || !novoResponsavelTelefone.value.trim()) return
  try {
    const novo = await createResponsavel({
      nome: novoResponsavelNome.value.trim(),
      telefone: novoResponsavelTelefone.value.trim()
    })
    responsaveis.value.push(novo)
    setupResponsavel.value = novo
    novoResponsavelNome.value = ''
    novoResponsavelTelefone.value = ''
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar responsável', color: 'red' })
  }
}

const allSetorProdutosData = ref<{ id: string; setor_id: string; produto_id: string; produto: { id: string; nome: string } | null }[]>([])

const setorProdutosPorSetor = computed(() => {
  const map: Record<string, { id: string; nome: string }[]> = {}
  for (const sp of allSetorProdutosData.value) {
    if (!map[sp.setor_id]) map[sp.setor_id] = []
    if (sp.produto) map[sp.setor_id].push(sp.produto)
  }
  return map
})

const setoresFiltradosSetup = computed(() => {
  if (!setupBuscaSetor.value) return setores.value
  const term = setupBuscaSetor.value.toLowerCase()
  return setores.value.filter(s => s.nome.toLowerCase().includes(term))
})

const toggleSetorSelecionado = (setorId: string) => {
  const newSet = new Set(setupSetoresSelecionados.value)
  if (newSet.has(setorId)) {
    newSet.delete(setorId)
  } else {
    newSet.add(setorId)
  }
  setupSetoresSelecionados.value = newSet
}

// ==========================================
// CONTAGEM POR SETOR (etapa contagem)
// ==========================================

// Armazena os itens de contagem POR SETOR
const itensContagemPorSetor = ref<Record<string, ContagemItem[]>>({})
const setoresParaContar = ref<Setor[]>([])
const setorAtualIndex = ref(0)
const buscaContagem = ref('')
const inputRefs = ref<Record<number, any>>({})

const setorAtualNome = computed(() => {
  const setor = setoresParaContar.value[setorAtualIndex.value]
  return setor?.nome || ''
})

const itensContagemSetor = computed(() => {
  const setor = setoresParaContar.value[setorAtualIndex.value]
  if (!setor) return []
  return itensContagemPorSetor.value[setor.id] || []
})

const itensContagemSetorFiltrados = computed(() => {
  if (!buscaContagem.value) return itensContagemSetor.value
  const term = buscaContagem.value.toLowerCase()
  return itensContagemSetor.value.filter(item =>
    item.nome.toLowerCase().includes(term) ||
    item.subgrupo_nome.toLowerCase().includes(term)
  )
})

const itensContadosSetor = computed(() => itensContagemSetor.value.filter(i => i.quantidade_contada !== null).length)
const progressoPercentSetor = computed(() => {
  if (itensContagemSetor.value.length === 0) return 0
  return Math.round((itensContadosSetor.value / itensContagemSetor.value.length) * 100)
})

// Todos os itens de todos os setores (flat)
const todosItensContagem = computed(() => {
  const all: ContagemItem[] = []
  for (const items of Object.values(itensContagemPorSetor.value)) {
    all.push(...items)
  }
  return all
})

const itensContadosTotal = computed(() => todosItensContagem.value.filter(i => i.quantidade_contada !== null).length)
const itensNaoContadosTotal = computed(() => todosItensContagem.value.length - itensContadosTotal.value)
const itensComSobraTotal = computed(() => todosItensContagem.value.filter(i => i.diferenca !== null && i.diferenca > 0).length)
const itensComFaltaTotal = computed(() => todosItensContagem.value.filter(i => i.diferenca !== null && i.diferenca < 0).length)
const todosItensComDiferenca = computed(() => todosItensContagem.value.filter(i => i.diferenca !== null && i.diferenca !== 0))

const contagemPorSetor = computed(() => {
  const result: Record<string, { contados: number; total: number }> = {}
  for (const [setorId, items] of Object.entries(itensContagemPorSetor.value)) {
    result[setorId] = {
      contados: items.filter(i => i.quantidade_contada !== null).length,
      total: items.length
    }
  }
  return result
})

const valorTotalDivergenciaContagem = computed(() => {
  return todosItensContagem.value
    .filter(i => i.valor_divergencia !== null)
    .reduce((sum, i) => sum + (i.valor_divergencia || 0), 0)
})

const setInputRef = (index: number, el: any) => {
  if (el) inputRefs.value[index] = el
}

const focarProximo = (currentIndex: number) => {
  const nextEl = inputRefs.value[currentIndex + 1]
  if (nextEl?.$el) {
    const input = nextEl.$el.querySelector('input')
    if (input) input.focus()
  }
}

const atualizarContagem = (produtoId: string, valor: any) => {
  // Atualizar no setor atual
  const setor = setoresParaContar.value[setorAtualIndex.value]
  if (!setor) return
  const items = itensContagemPorSetor.value[setor.id]
  if (!items) return
  const item = items.find(i => i.produto_id === produtoId)
  if (!item) return

  const num = valor === '' || valor === null || valor === undefined ? null : Number(valor)
  item.quantidade_contada = num
  item.diferenca = num !== null ? num - item.saldo_sistema : null
  item.valor_divergencia = item.diferenca !== null ? item.diferenca * item.custo_medio : null
}

const irParaSetor = (idx: number) => {
  setorAtualIndex.value = idx
  buscaContagem.value = ''
  inputRefs.value = {}
}

const proximoSetor = () => {
  if (setorAtualIndex.value < setoresParaContar.value.length - 1) {
    irParaSetor(setorAtualIndex.value + 1)
  }
}

const setorAnterior = () => {
  if (setorAtualIndex.value > 0) {
    irParaSetor(setorAtualIndex.value - 1)
  }
}

// ==========================================
// REVISAO (etapa revisao)
// ==========================================
const motivoContagem = ref('')
const apenasComDiferenca = ref(true)
const salvando = ref(false)
const resumoSalvamento = ref('')

const itensParaSalvar = computed(() => {
  if (apenasComDiferenca.value) {
    return todosItensContagem.value.filter(i => i.diferenca !== null && i.diferenca !== 0)
  }
  return todosItensContagem.value.filter(i => i.quantidade_contada !== null)
})

// ==========================================
// HISTORICO (ajustes antigos)
// ==========================================
const showHistorico = ref(false)
const loadingHistorico = ref(false)
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

const contagensAgrupadas = computed<ContagemHistorico[]>(() => {
  const map = new Map<string, ContagemHistorico>()

  for (const ajuste of ajustesFiltrados.value) {
    const key = `${ajuste.data}||${ajuste.motivo || 'Sem motivo'}`
    if (!map.has(key)) {
      const motivo = ajuste.motivo || 'Sem motivo'
      let tipoContagem: TipoContagem = 'estoque'
      let setorNome = ''
      let motivoLimpo = motivo

      const metaMatch = motivo.match(/^\[([^\]]+)\]\s*/)
      if (metaMatch) {
        const parts = metaMatch[1].split('|')
        if (parts[0] === 'INV') tipoContagem = 'inventario'
        if (parts[1]) setorNome = parts[1]
        motivoLimpo = motivo.slice(metaMatch[0].length)
      }

      const dashIdx = motivoLimpo.lastIndexOf(' — ')
      if (dashIdx > 0) motivoLimpo = motivoLimpo.slice(0, dashIdx)

      map.set(key, {
        data: ajuste.data,
        motivo: motivoLimpo || 'Sem motivo',
        tipo_contagem: tipoContagem,
        setor_nome: setorNome,
        grupo_nome: ajuste.produto?.subgrupo?.grupo?.nome || '',
        subgrupo_nome: ajuste.produto?.subgrupo?.nome || '',
        total_itens: 0,
        total_sobras: 0,
        total_faltas: 0,
        total_zerados: 0,
        valor_total_divergencia: 0,
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

    const saldo = saldos.value.find(s => s.produto_id === ajuste.produto_id)
    contagem.valor_total_divergencia += qty * (saldo?.custo_medio || 0)
  }

  return Array.from(map.values()).sort((a, b) => b.data.localeCompare(a.data))
})

const contagensAgrupadasPaginadas = computed(() => {
  const start = (pageHistorico.value - 1) * pageSizeHistorico.value
  return contagensAgrupadas.value.slice(start, start + pageSizeHistorico.value)
})

const toggleHistorico = (idx: number) => {
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
const modalExcluirContagemPersistidaOpen = ref(false)
const ajusteParaExcluir = ref<Ajuste | null>(null)
const contagemHistoricoParaExcluir = ref<ContagemHistorico | null>(null)
const excluindo = ref(false)

// ==========================================
// ACOES
// ==========================================

const statusColor = (status: string) => {
  switch (status) {
    case 'aguardando': return 'yellow'
    case 'em_andamento': return 'blue'
    case 'finalizada': return 'green'
    default: return 'gray'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'aguardando': return 'Aguardando'
    case 'em_andamento': return 'Em andamento'
    case 'finalizada': return 'Finalizada'
    default: return status
  }
}

const statusLabelTabela = (status: string) => {
  switch (status) {
    case 'atrasada': return 'Atrasada'
    case 'aguardando':
    case 'pendente': return 'Aguardando Contagem'
    case 'em_andamento': return 'Em Andamento'
    case 'finalizada': return 'Finalizada'
    default: return '-'
  }
}

const labelRecorrencia = (recorrencia?: string) => {
  switch (recorrencia) {
    case 'diaria': return 'Diária'
    case 'semanal': return 'Semanal'
    case 'quinzenal': return 'Quinzenal'
    case 'mensal': return 'Mensal'
    default: return '-'
  }
}

/**
 * Calcula quantas contagens foram feitas no mês vs quantas deveriam ter sido feitas ATÉ HOJE
 * Ex: Diária em fev/28 dias, se hoje é dia 27 → esperadas = 27 (não 28)
 */
const calcProgressoMensal = (contagem: Contagem): { feitas: number; esperadas: number } => {
  const rec = contagem.recorrencia || 'nenhuma'
  if (rec === 'nenhuma') return { feitas: 0, esperadas: 0 }

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const diaHoje = hoje.getDate()

  // Contar esperadas apenas ATÉ HOJE (dia 1 até dia atual, inclusive)
  let esperadas = 0
  if (rec === 'diaria') {
    esperadas = diaHoje
  } else if (rec === 'semanal') {
    const diasConfig = contagem.dias_semana || []
    if (diasConfig.length === 0) {
      esperadas = Math.ceil(diaHoje / 7)
    } else {
      let count = 0
      for (let d = 1; d <= diaHoje; d++) {
        const diaSemana = new Date(ano, mes, d).getDay()
        const label = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][diaSemana]
        if (diasConfig.includes(label)) count++
      }
      esperadas = count
    }
  } else if (rec === 'quinzenal') {
    esperadas = diaHoje >= 15 ? 2 : 1
  } else if (rec === 'mensal') {
    esperadas = 1
  }

  const feitas = contagem.progresso || 0

  return { feitas, esperadas }
}

const calcProximaContagem = (contagem: Contagem) => {
  // Placeholder — será calculado com base na recorrência e última contagem
  if (!contagem.recorrencia || contagem.recorrencia === 'nenhuma') return '-'
  if (contagem.status === 'finalizada') return '-'

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataContagem = new Date(contagem.data + 'T00:00:00')

  const diffMs = dataContagem.getTime() - hoje.getTime()
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const horario = contagem.horario_notificacao || '7:00'

  if (diffDias < 0) return 'Atrasada'
  if (diffDias === 0) return `Hoje (${horario})`
  if (diffDias === 1) return `Amanhã (${horario})`
  return `Em ${diffDias} dias`
}

const carregarDadosBase = async () => {
  try {
    const [g, s, p, st, counts] = await Promise.all([
      getGrupos(),
      getSubgrupos(),
      getProdutos(),
      getSetores().catch(() => [] as Setor[]),
      countSetorProdutos().catch(() => ({} as Record<string, number>))
    ])
    grupos.value = g
    subgrupos.value = s
    produtos.value = p
    setores.value = st
    setorProdutosCount.value = counts
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar dados', color: 'red' })
  }
}

const carregarContagens = async () => {
  try {
    loadingContagens.value = true
    contagensPersistidas.value = await getContagens()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar contagens', color: 'red' })
  } finally {
    loadingContagens.value = false
  }
}

const carregarHistorico = async () => {
  try {
    loadingHistorico.value = true
    const [ajustes, todosSaldos] = await Promise.all([
      getAjustes({
        dataInicio: filtroDataInicio.value || undefined,
        dataFim: filtroDataFim.value || undefined
      }),
      getSaldoEstoque()
    ])
    todosAjustes.value = ajustes
    saldos.value = todosSaldos
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar historico', color: 'red' })
  } finally {
    loadingHistorico.value = false
  }
}

const abrirModalSetup = async () => {
  setupData.value = new Date().toISOString().split('T')[0]
  setupNomeContagem.value = ''
  setupRecorrencia.value = 'nenhuma'
  setupHorarioNotificacao.value = '07:00'
  setupDiasSemana.value = new Set()
  setupMensalPosicao.value = 'primeira'
  setupMensalDia.value = 'segunda'
  setupResponsavel.value = null
  setupSetoresSelecionados.value = new Set()
  setupBuscaSetor.value = ''
  slideoverSetupOpen.value = true

  try {
    allSetorProdutosData.value = await getAllSetorProdutos()
  } catch {}
}

const criarContagemPersistida = async () => {
  if (!setupNomeContagem.value.trim() || !setupRecorrencia.value || !setupResponsavel.value || setupSetoresSelecionados.value.size === 0) return
  try {
    loadingSetup.value = true

    // Montar dias_semana como array
    const diasSemanaArr = Array.from(setupDiasSemana.value)

    await createContagem(
      {
        nome: setupNomeContagem.value.trim(),
        tipo: 'estoque' as TipoContagem,
        data: setupData.value,
        recorrencia: setupRecorrencia.value,
        horario_notificacao: setupHorarioNotificacao.value,
        dias_semana: diasSemanaArr.length > 0 ? diasSemanaArr : undefined,
        mensal_posicao: setupRecorrencia.value === 'mensal' ? setupMensalPosicao.value : undefined,
        mensal_dia: setupRecorrencia.value === 'mensal' ? setupMensalDia.value : undefined,
        responsavel_nome: setupResponsavel.value.nome,
        responsavel_telefone: setupResponsavel.value.telefone,
        responsavel_id: (setupResponsavel.value as any).id || undefined
      },
      Array.from(setupSetoresSelecionados.value)
    )
    slideoverSetupOpen.value = false
    toast.add({ title: 'Sucesso', description: 'Contagem criada com sucesso', color: 'green' })
    await carregarContagens()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao criar contagem', color: 'red' })
  } finally {
    loadingSetup.value = false
  }
}

const abrirDetalhes = async (contagem: Contagem) => {
  contagemSelecionada.value = contagem
  etapa.value = 'detalhes'

  // Carregar produtos de cada setor desta contagem
  const setorIds = (contagem.contagem_setores || []).map(cs => cs.setor_id)
  const prodMap: Record<string, { id: string; nome: string }[]> = {}
  const countMap: Record<string, number> = {}

  try {
    const allSP = await getAllSetorProdutos()
    for (const sp of allSP) {
      if (setorIds.includes(sp.setor_id)) {
        if (!prodMap[sp.setor_id]) prodMap[sp.setor_id] = []
        if (sp.produto) prodMap[sp.setor_id].push(sp.produto)
      }
    }
    for (const sid of setorIds) {
      countMap[sid] = (prodMap[sid] || []).length
    }
  } catch {}

  detalhesSetorProdutos.value = prodMap
  detalhesSetorProdutosCount.value = countMap
}

const iniciarContagemDetalhes = async () => {
  if (!contagemSelecionada.value) return
  try {
    loadingIniciar.value = true

    // Atualizar status para em_andamento
    await updateContagemStatus(contagemSelecionada.value.id, 'em_andamento')

    // Carregar saldos
    const todosSaldos = await getSaldoEstoque()
    saldos.value = todosSaldos

    // Montar setores para contar
    const setorIds = (contagemSelecionada.value.contagem_setores || []).map(cs => cs.setor_id)
    const setoresOrdenados = setores.value.filter(s => setorIds.includes(s.id))
    setoresParaContar.value = setoresOrdenados

    // Carregar produtos de cada setor
    const allSP = await getAllSetorProdutos()
    const spPorSetor: Record<string, string[]> = {}
    for (const sp of allSP) {
      if (setorIds.includes(sp.setor_id)) {
        if (!spPorSetor[sp.setor_id]) spPorSetor[sp.setor_id] = []
        spPorSetor[sp.setor_id].push(sp.produto_id)
      }
    }

    // Montar itens de contagem por setor
    const novoMap: Record<string, ContagemItem[]> = {}
    for (const setor of setoresOrdenados) {
      const produtoIds = spPorSetor[setor.id] || []
      const prods = produtos.value.filter(p => produtoIds.includes(p.id))
      novoMap[setor.id] = prods.map(p => {
        const saldo = todosSaldos.find(s => s.produto_id === p.id)
        const sub = subgrupos.value.find(s => s.id === p.subgrupo_id)
        const grp = sub ? grupos.value.find(g => g.id === sub.grupo_id) : null
        return {
          produto_id: p.id,
          nome: p.nome,
          unidade_sigla: p.unidade?.sigla || '',
          subgrupo_nome: p.subgrupo?.nome || sub?.nome || '',
          grupo_nome: grp?.nome || p.subgrupo?.grupo?.nome || '',
          saldo_sistema: Number(saldo?.saldo_principal || 0),
          quantidade_contada: null,
          diferenca: null,
          custo_medio: Number(saldo?.custo_medio || 0),
          valor_divergencia: null
        }
      }).sort((a, b) => a.nome.localeCompare(b.nome))
    }

    itensContagemPorSetor.value = novoMap
    setorAtualIndex.value = 0
    buscaContagem.value = ''
    setupNomeContagem.value = contagemSelecionada.value.nome
    setupData.value = contagemSelecionada.value.data
    motivoContagem.value = contagemSelecionada.value.nome
    apenasComDiferenca.value = true
    etapa.value = 'contagem'
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao iniciar contagem', color: 'red' })
  } finally {
    loadingIniciar.value = false
  }
}

const confirmarSairContagem = () => {
  if (itensContadosTotal.value > 0) {
    modalSairOpen.value = true
  } else {
    voltarParaDetalhesOuPrincipal()
  }
}

const voltarParaDetalhesOuPrincipal = () => {
  if (contagemSelecionada.value) {
    etapa.value = 'detalhes'
  } else {
    etapa.value = 'principal'
  }
}

const descartarContagem = () => {
  modalSairOpen.value = false
  itensContagemPorSetor.value = {}
  setoresParaContar.value = []
  voltarParaDetalhesOuPrincipal()
}

const abrirRevisao = () => {
  etapa.value = 'revisao'
}

const salvarContagem = async () => {
  if (!motivoContagem.value.trim()) {
    toast.add({ title: 'Atenção', description: 'Informe o motivo/observacao da contagem', color: 'yellow' })
    return
  }

  try {
    salvando.value = true

    const ajustesPayload = itensParaSalvar.value.map(item => ({
      produto_id: item.produto_id,
      data: setupData.value,
      quantidade: item.diferenca!,
      motivo: motivoContagem.value.trim()
    }))

    await createAjustesEmLote(ajustesPayload)

    // Atualizar status da contagem persistida para finalizada
    if (contagemSelecionada.value) {
      await updateContagemStatus(contagemSelecionada.value.id, 'finalizada')
    }

    const sobras = ajustesPayload.filter(a => a.quantidade > 0).length
    const faltas = ajustesPayload.filter(a => a.quantidade < 0).length
    const zeros = ajustesPayload.filter(a => a.quantidade === 0).length

    const parts: string[] = []
    if (sobras > 0) parts.push(`${sobras} ${sobras === 1 ? 'sobra' : 'sobras'}`)
    if (faltas > 0) parts.push(`${faltas} ${faltas === 1 ? 'falta' : 'faltas'}`)
    if (zeros > 0) parts.push(`${zeros} sem diferenca`)
    resumoSalvamento.value = `${ajustesPayload.length} ${ajustesPayload.length === 1 ? 'ajuste registrado' : 'ajustes registrados'}: ${parts.join(', ')}.`

    toast.add({ title: 'Sucesso', description: 'Contagem salva com sucesso!', color: 'green' })

    itensContagemPorSetor.value = {}
    setoresParaContar.value = []
    contagemSelecionada.value = null
    etapa.value = 'principal'
    modalSucessoOpen.value = true

    await Promise.all([carregarContagens(), carregarHistorico()])
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar contagem', color: 'red' })
  } finally {
    salvando.value = false
  }
}

const fecharSucesso = () => {
  modalSucessoOpen.value = false
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
    toast.add({ title: 'Sucesso', description: 'Ajuste excluido', color: 'green' })
    modalExcluirItemOpen.value = false
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir', color: 'red' })
  } finally {
    excluindo.value = false
  }
}

const confirmarExclusaoContagem = (contagem: ContagemHistorico) => {
  contagemHistoricoParaExcluir.value = contagem
  modalExcluirContagemOpen.value = true
}

const excluirContagemConfirmada = async () => {
  if (!contagemHistoricoParaExcluir.value) return
  try {
    excluindo.value = true
    const ids = contagemHistoricoParaExcluir.value.ajustes.map(a => a.id)
    await deleteAjustesEmLote(ids)
    toast.add({ title: 'Sucesso', description: 'Contagem excluida', color: 'green' })
    modalExcluirContagemOpen.value = false
    expandedContagens.value.clear()
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir contagem', color: 'red' })
  } finally {
    excluindo.value = false
  }
}

const confirmarExclusaoContagemPersistida = () => {
  modalExcluirContagemPersistidaOpen.value = true
}

const excluirContagemPersistidaConfirmada = async () => {
  if (!contagemSelecionada.value) return
  try {
    excluindo.value = true
    await deleteContagem(contagemSelecionada.value.id)
    toast.add({ title: 'Sucesso', description: 'Contagem excluida', color: 'green' })
    modalExcluirContagemPersistidaOpen.value = false
    contagemSelecionada.value = null
    etapa.value = 'principal'
    await carregarContagens()
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

const truncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const formatNumber = (value: number | undefined | null) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value || 0))
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
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
    await Promise.all([
      carregarContagens(),
      carregarResponsaveis()
    ])
  }
}, { immediate: true })
</script>
