<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lista de Pedidos</h1>
        <p class="text-sm text-gray-500">Crie pedidos de compra por grupo/subgrupo e envie pelo WhatsApp</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="abrirModalSetup">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Novo Pedido
      </UButton>
    </div>

    <!-- Filtros -->
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
            placeholder="Buscar produto ou observação..."
            icon="i-heroicons-magnifying-glass"
          />
        </UFormGroup>
        <div class="flex items-end">
          <UButton color="gray" variant="soft" class="w-full" @click="limparFiltros">
            Limpar Filtros
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Resumo Skeleton -->
    <div v-if="loadingHistorico" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-5">
        <div class="flex items-center gap-4">
          <USkeleton class="h-12 w-12 rounded-lg" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-7 w-20" />
          </div>
        </div>
      </div>
    </div>

    <!-- Resumo -->
    <div v-if="!loadingHistorico" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de Pedidos</p>
            <p class="text-2xl font-bold text-gray-900">{{ pedidosFiltrados.length }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Enviados</p>
            <p class="text-2xl font-bold text-green-600">{{ pedidosEnviados }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Rascunhos</p>
            <p class="text-2xl font-bold text-yellow-600">{{ pedidosRascunho }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Lista de pedidos -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">Histórico de Pedidos</h3>
      </template>

      <div v-if="loadingHistorico" class="p-5 space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-4">
            <USkeleton class="h-10 w-10 rounded-lg" />
            <div class="space-y-2">
              <USkeleton class="h-4 w-40" />
              <USkeleton class="h-3 w-28" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <USkeleton class="h-4 w-16" />
            <USkeleton class="h-5 w-5 rounded-full" />
          </div>
        </div>
      </div>

      <div v-else-if="pedidosFiltrados.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
        <UIcon name="i-heroicons-inbox" class="w-10 h-10 mb-3" />
        <p class="text-sm">Nenhum pedido registrado</p>
        <p class="text-xs text-gray-400 mt-1">Clique em "Novo Pedido" para começar</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div v-for="pedido in pedidosPaginados" :key="pedido.id">
          <!-- Linha principal -->
          <button
            class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
            @click="togglePedido(pedido.id)"
          >
            <div class="flex items-center gap-4">
              <div class="p-2 rounded-lg" :class="pedido.status === 'enviado' ? 'bg-green-50' : pedido.status === 'concluido' ? 'bg-blue-50' : 'bg-yellow-50'">
                <UIcon
                  :name="pedido.status === 'enviado' ? 'i-heroicons-paper-airplane' : pedido.status === 'concluido' ? 'i-heroicons-check-circle' : 'i-heroicons-document-text'"
                  class="w-5 h-5"
                  :class="pedido.status === 'enviado' ? 'text-green-600' : pedido.status === 'concluido' ? 'text-blue-600' : 'text-yellow-600'"
                />
              </div>
              <div>
                <p class="font-semibold text-gray-900">
                  Pedido {{ formatDate(pedido.data) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ pedido.itens?.length || 0 }} {{ (pedido.itens?.length || 0) === 1 ? 'item' : 'itens' }}
                  <span v-if="pedido.observacao" class="mx-1">&middot;</span>
                  <span v-if="pedido.observacao" class="text-gray-400">{{ pedido.observacao }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UBadge
                :color="pedido.status === 'enviado' ? 'green' : pedido.status === 'concluido' ? 'blue' : 'yellow'"
                variant="subtle"
                size="xs"
              >
                {{ pedido.status === 'enviado' ? 'Enviado' : pedido.status === 'concluido' ? 'Concluído' : 'Rascunho' }}
              </UBadge>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-5 h-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': expandedPedidos.has(pedido.id) }"
              />
            </div>
          </button>

          <!-- Detalhes expandidos -->
          <div v-if="expandedPedidos.has(pedido.id)" class="bg-gray-50 px-6 py-4">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-500 border-b border-gray-200">
                    <th class="pb-2 font-medium">Produto</th>
                    <th class="pb-2 font-medium text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in pedido.itens" :key="item.id" class="border-b border-gray-100 last:border-0">
                    <td class="py-2">
                      <p class="font-medium text-gray-900">{{ item.produto?.nome || '-' }}</p>
                      <p class="text-xs text-gray-500">{{ item.produto?.subgrupo?.grupo?.nome }} / {{ item.produto?.subgrupo?.nome }}</p>
                    </td>
                    <td class="py-2 text-right">
                      <span class="font-semibold text-gray-900">
                        {{ formatNumber(item.quantidade) }}
                        {{ item.produto?.unidade?.sigla || '' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 flex flex-wrap justify-end gap-2">
              <UButton
                color="gray"
                variant="soft"
                size="sm"
                @click.stop="imprimirPedido(pedido)"
              >
                <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-1" />
                Imprimir
              </UButton>
              <UButton
                color="green"
                variant="soft"
                size="sm"
                @click.stop="enviarWhatsApp(pedido)"
              >
                <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 mr-1" />
                Enviar WhatsApp
              </UButton>
              <UButton
                v-if="pedido.status === 'rascunho'"
                color="blue"
                variant="soft"
                size="sm"
                @click.stop="marcarEnviado(pedido)"
              >
                <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 mr-1" />
                Marcar Enviado
              </UButton>
              <UButton
                v-if="pedido.status === 'enviado'"
                color="blue"
                variant="soft"
                size="sm"
                @click.stop="marcarConcluido(pedido)"
              >
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
                Marcar Concluído
              </UButton>
              <UButton
                color="red"
                variant="ghost"
                size="sm"
                @click.stop="confirmarExclusao(pedido)"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                Excluir
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <TablePagination
        v-if="pedidosFiltrados.length > 0"
        v-model="pageHistorico"
        :page-size="pageSizeHistorico"
        :total-items="pedidosFiltrados.length"
        @update:page-size="pageSizeHistorico = $event"
      />
    </UCard>

    <!-- ============================================ -->
    <!-- MODAL: NOVO PEDIDO (3 fases)                 -->
    <!-- ============================================ -->
    <UModal
      v-model="modalPedidoOpen"
      :ui="{
        width: 'sm:max-w-5xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
      :prevent-close="itensPreenchidos > 0"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg flex items-center justify-center" :class="faseModal === 3 ? 'bg-green-100' : 'bg-blue-100'">
                <UIcon
                  :name="faseModal === 1 ? 'i-heroicons-clipboard-document-list' : faseModal === 2 ? 'i-heroicons-pencil-square' : 'i-heroicons-check-circle'"
                  class="w-5 h-5"
                  :class="faseModal === 3 ? 'text-green-600' : 'text-blue-600'"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ faseModal === 1 ? 'Novo Pedido' : faseModal === 2 ? 'Quantidades' : 'Revisão do Pedido' }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ faseModal === 1 ? 'Selecione grupos e subgrupos' : faseModal === 2 ? resumoSelecoes : `${itensParaSalvar.length} itens · ${formatDate(setupData)}` }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Steps indicator -->
              <div class="hidden sm:flex items-center gap-1.5 mr-2">
                <div v-for="i in 3" :key="i" class="flex items-center gap-1.5">
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    :class="i <= faseModal ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'"
                  >
                    {{ i }}
                  </div>
                  <div v-if="i < 3" class="w-4 h-0.5" :class="i < faseModal ? 'bg-blue-600' : 'bg-gray-200'" />
                </div>
              </div>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="tentarFecharModal"
              />
            </div>
          </div>
        </template>

        <!-- FASE 1: Setup -->
        <div v-if="faseModal === 1" class="max-w-xl mx-auto space-y-5">
          <UFormGroup label="Data do Pedido" required>
            <UInput v-model="setupData" type="date" />
          </UFormGroup>

          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- Seleção de grupo/subgrupo para adicionar -->
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700">Adicionar Grupo / Subgrupo</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UFormGroup label="Grupo">
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
              </UFormGroup>
            </div>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              :disabled="!setupGrupoId"
              @click="adicionarGrupoSubgrupo"
            >
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Adicionar ao pedido
            </UButton>
          </div>

          <!-- Lista de grupo/subgrupo selecionados -->
          <div v-if="selecoes.length > 0" class="space-y-2">
            <p class="text-sm font-medium text-gray-700">Grupos selecionados</p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(sel, idx) in selecoes"
                :key="idx"
                class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800"
              >
                <span class="font-medium">{{ sel.grupoNome }}</span>
                <span v-if="sel.subgrupoNome" class="text-blue-500">/ {{ sel.subgrupoNome }}</span>
                <button
                  class="ml-1 p-0.5 rounded-full hover:bg-blue-200 transition-colors"
                  @click="removerSelecao(idx)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="selecoes.length > 0" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600" />
              <span class="text-sm text-blue-800 font-medium">
                {{ produtosParaMontar.length }} {{ produtosParaMontar.length === 1 ? 'produto será listado' : 'produtos serão listados' }}
              </span>
            </div>
          </div>
        </div>

        <!-- FASE 2: Quantidades -->
        <div v-if="faseModal === 2" class="space-y-4">
          <!-- Barra de progresso -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Progresso</span>
            <span class="text-sm font-bold" :class="itensPreenchidos === itensPedido.length ? 'text-green-600' : 'text-blue-600'">
              {{ itensPreenchidos }} de {{ itensPedido.length }} produtos
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="itensPreenchidos === itensPedido.length ? 'bg-green-500' : 'bg-blue-500'"
              :style="{ width: progressoPercent + '%' }"
            />
          </div>

          <!-- Busca -->
          <UInput
            v-model="buscaMontagem"
            placeholder="Buscar produto..."
            icon="i-heroicons-magnifying-glass"
          />

          <!-- Tabela -->
          <div class="max-h-[55vh] overflow-y-auto border border-gray-200 rounded-lg">
            <!-- Header -->
            <div class="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
              <div class="col-span-5">Produto</div>
              <div class="col-span-3 text-center">Quantidade</div>
              <div class="col-span-4">Obs.</div>
            </div>

            <div class="divide-y divide-gray-100">
              <div
                v-for="(item, idx) in itensMontagemFiltrados"
                :key="item.produto_id"
                class="px-4 py-2.5 hover:bg-gray-50/50 transition-colors"
                :class="{ 'bg-blue-50/30': item.quantidade !== null && item.quantidade > 0 }"
              >
                <!-- Desktop -->
                <div class="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                  <div class="col-span-5">
                    <p class="font-medium text-gray-900 text-sm">{{ item.nome }}</p>
                    <p class="text-xs text-gray-500">{{ item.subgrupo_nome }} &middot; {{ item.unidade_sigla }}</p>
                  </div>
                  <div class="col-span-3 flex justify-center">
                    <UInput
                      :ref="(el) => setInputRef(idx, el)"
                      :model-value="item.quantidade"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="—"
                      size="xs"
                      class="w-24"
                      :ui="{ base: 'text-center font-mono' }"
                      @update:model-value="atualizarQuantidade(item.produto_id, $event)"
                      @keydown.enter="focarProximo(idx)"
                    />
                  </div>
                  <div class="col-span-4">
                    <UInput
                      :model-value="item.observacao"
                      placeholder="Obs."
                      size="xs"
                      @update:model-value="atualizarObservacao(item.produto_id, $event)"
                    />
                  </div>
                </div>

                <!-- Mobile -->
                <div class="sm:hidden space-y-2">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-gray-900 text-sm">{{ item.nome }}</p>
                      <p class="text-xs text-gray-500">{{ item.subgrupo_nome }} &middot; {{ item.unidade_sigla }}</p>
                    </div>
                    <span v-if="item.quantidade" class="text-sm font-bold text-blue-600">
                      {{ formatNumber(item.quantidade) }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <UInput
                      :model-value="item.quantidade"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="Qtd."
                      size="xs"
                      :ui="{ base: 'font-mono' }"
                      @update:model-value="atualizarQuantidade(item.produto_id, $event)"
                    />
                    <UInput
                      :model-value="item.observacao"
                      placeholder="Obs."
                      size="xs"
                      @update:model-value="atualizarObservacao(item.produto_id, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="itensMontagemFiltrados.length === 0 && buscaMontagem" class="flex flex-col items-center justify-center py-6 text-gray-500">
              <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6 mb-2" />
              <p class="text-sm">Nenhum produto encontrado para "{{ buscaMontagem }}"</p>
            </div>
          </div>
        </div>

        <!-- FASE 3: Revisão -->
        <div v-if="faseModal === 3" class="space-y-5">
          <!-- Card de resumo -->
          <div class="p-4 bg-blue-50 rounded-lg text-center">
            <p class="text-2xl font-bold text-blue-600">{{ itensParaSalvar.length }}</p>
            <p class="text-xs text-blue-700 mt-1">Itens no pedido</p>
          </div>

          <!-- Lista dos itens -->
          <div class="max-h-[40vh] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div
              v-for="item in itensParaSalvar"
              :key="item.produto_id"
              class="flex items-center justify-between px-4 py-2.5"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm">{{ item.nome }}</p>
                <p class="text-xs text-gray-500">
                  {{ item.subgrupo_nome }}
                  <span v-if="item.observacao" class="mx-1">&middot;</span>
                  <span v-if="item.observacao" class="italic">{{ item.observacao }}</span>
                </p>
              </div>
              <span class="font-bold text-sm text-blue-600 ml-3 whitespace-nowrap">
                {{ formatNumber(item.quantidade!) }} {{ item.unidade_sigla }}
              </span>
            </div>
          </div>

          <!-- Observação geral -->
          <UFormGroup label="Observação geral do pedido">
            <UTextarea
              v-model="observacaoPedido"
              placeholder="Ex: Pedido semanal, entrega até sexta..."
              rows="2"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <!-- Lado esquerdo -->
            <div>
              <UButton
                v-if="faseModal > 1"
                color="gray"
                variant="ghost"
                @click="faseModal--"
              >
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
                Voltar
              </UButton>
            </div>

            <!-- Lado direito -->
            <div class="flex flex-col-reverse sm:flex-row gap-2">
              <UButton
                v-if="faseModal === 1"
                color="gray"
                variant="ghost"
                @click="modalPedidoOpen = false"
              >
                Cancelar
              </UButton>
              <UButton
                v-if="faseModal === 1"
                color="primary"
                :disabled="selecoes.length === 0 || produtosParaMontar.length === 0"
                @click="iniciarMontagem"
              >
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 mr-1" />
                Avançar
              </UButton>

              <UButton
                v-if="faseModal === 2"
                color="primary"
                :disabled="itensPreenchidos === 0"
                @click="faseModal = 3"
              >
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 mr-1" />
                Revisar ({{ itensPreenchidos }})
              </UButton>

              <UButton
                v-if="faseModal === 3"
                color="gray"
                :loading="salvandoRascunho"
                :disabled="itensParaSalvar.length === 0 || salvandoWhatsApp"
                @click="salvarPedido('rascunho')"
              >
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-1" />
                Salvar Rascunho
              </UButton>
              <UButton
                v-if="faseModal === 3"
                color="primary"
                :loading="salvandoWhatsApp"
                :disabled="itensParaSalvar.length === 0 || salvandoRascunho"
                @click="salvarEEnviarWhatsApp"
              >
                <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 mr-1" />
                Salvar e Enviar WhatsApp
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Sair sem salvar -->
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
          <h3 class="text-lg font-semibold text-yellow-700">Descartar pedido?</h3>
        </template>
        <p>Você tem <strong>{{ itensPreenchidos }}</strong> {{ itensPreenchidos === 1 ? 'produto preenchido' : 'produtos preenchidos' }}. Se sair agora, todos os dados serão perdidos.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalSairOpen = false">Continuar editando</UButton>
            <UButton color="red" class="w-full sm:w-auto" @click="descartarEFechar">Descartar</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Sucesso -->
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
            <div class="p-2 bg-green-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold">Pedido salvo!</h3>
          </div>
        </template>
        <p>{{ resumoSalvamento }}</p>
        <p class="mt-2 text-sm text-gray-500">Deseja criar outro pedido?</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalSucessoOpen = false">Não, finalizar</UButton>
            <UButton color="primary" class="w-full sm:w-auto" @click="novoPedidoAposSucesso">Sim, criar outro</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Excluir pedido -->
    <UModal
      v-model="modalExcluirOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Pedido</h3>
        </template>
        <p>Tem certeza que deseja excluir este pedido?</p>
        <div v-if="pedidoParaExcluir" class="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
          <p><strong>Data:</strong> {{ formatDate(pedidoParaExcluir.data) }}</p>
          <p><strong>Itens:</strong> {{ pedidoParaExcluir.itens?.length || 0 }}</p>
        </div>
        <p class="text-sm text-red-500 mt-2">Esta ação não pode ser desfeita.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirConfirmado">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Pedido, Produto, Grupo, Subgrupo, PedidoContagemItem } from '~/types'

const toast = useToast()
const {
  getGrupos, getSubgrupos, getProdutos,
  getPedidos, createPedido, updatePedidoStatus, deletePedido: removePedido
} = useEstoque()
const { empresaId, empresaAtiva } = useEmpresa()

// ==========================================
// DADOS BASE
// ==========================================
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const produtos = ref<Produto[]>([])
const todosPedidos = ref<Pedido[]>([])
const loadingHistorico = ref(true)

// ==========================================
// MODAL NOVO PEDIDO (3 fases)
// ==========================================
const modalPedidoOpen = ref(false)
const faseModal = ref(1)

// Setup (fase 1)
const setupData = ref(new Date().toISOString().split('T')[0])
const setupGrupoId = ref('')
const setupSubgrupoId = ref('')

interface SelecaoGrupoSubgrupo {
  grupoId: string
  grupoNome: string
  subgrupoId: string
  subgrupoNome: string
}
const selecoes = ref<SelecaoGrupoSubgrupo[]>([])

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

const adicionarGrupoSubgrupo = () => {
  if (!setupGrupoId.value) return
  // Verifica se já existe essa combinação
  const jaExiste = selecoes.value.some(s =>
    s.grupoId === setupGrupoId.value && s.subgrupoId === setupSubgrupoId.value
  )
  if (jaExiste) {
    toast.add({ title: 'Aviso', description: 'Esta combinação já foi adicionada', color: 'yellow' })
    return
  }
  const grupo = grupos.value.find(g => g.id === setupGrupoId.value)
  const subgrupo = setupSubgrupoId.value ? subgrupos.value.find(s => s.id === setupSubgrupoId.value) : null
  selecoes.value.push({
    grupoId: setupGrupoId.value,
    grupoNome: grupo?.nome || '',
    subgrupoId: setupSubgrupoId.value,
    subgrupoNome: subgrupo?.nome || ''
  })
  setupGrupoId.value = ''
  setupSubgrupoId.value = ''
}

const removerSelecao = (idx: number) => {
  selecoes.value.splice(idx, 1)
}

const produtosParaMontar = computed(() => {
  if (selecoes.value.length === 0) return []
  const produtosSet = new Set<string>()
  const result: typeof produtos.value = []

  for (const sel of selecoes.value) {
    for (const p of produtos.value) {
      if (!p.subgrupo_id || produtosSet.has(p.id)) continue
      const grupoIdDoProduto = p.subgrupo?.grupo_id || subgrupos.value.find(s => s.id === p.subgrupo_id)?.grupo_id
      if (!grupoIdDoProduto) continue

      let match = false
      if (sel.subgrupoId) {
        match = p.subgrupo_id === sel.subgrupoId
      } else {
        match = grupoIdDoProduto === sel.grupoId
      }

      if (match) {
        produtosSet.add(p.id)
        result.push(p)
      }
    }
  }
  return result
})

const resumoSelecoes = computed(() => {
  return selecoes.value.map(s => s.subgrupoNome ? `${s.grupoNome} / ${s.subgrupoNome}` : s.grupoNome).join(', ')
})

watch(setupGrupoId, () => {
  setupSubgrupoId.value = ''
})

// Montagem (fase 2)
const itensPedido = ref<PedidoContagemItem[]>([])
const buscaMontagem = ref('')
const inputRefs = ref<Record<number, any>>({})

const setInputRef = (index: number, el: any) => {
  if (el) {
    inputRefs.value[index] = el
  }
}

const focarProximo = (currentIndex: number) => {
  const nextEl = inputRefs.value[currentIndex + 1]
  if (!nextEl) return
  try {
    const root = nextEl.$el || nextEl
    const input = root.querySelector?.('input')
    if (input) input.focus()
  } catch { /* ignore */ }
}

const itensMontagemFiltrados = computed(() => {
  if (!buscaMontagem.value) return itensPedido.value
  const term = buscaMontagem.value.toLowerCase()
  return itensPedido.value.filter(item =>
    item.nome.toLowerCase().includes(term) ||
    item.subgrupo_nome.toLowerCase().includes(term)
  )
})

const atualizarQuantidade = (produtoId: string, valor: any) => {
  const item = itensPedido.value.find(i => i.produto_id === produtoId)
  if (!item) return
  item.quantidade = valor === '' || valor === null || valor === undefined ? null : Number(valor)
}

const atualizarObservacao = (produtoId: string, valor: any) => {
  const item = itensPedido.value.find(i => i.produto_id === produtoId)
  if (!item) return
  item.observacao = valor || ''
}

const itensPreenchidos = computed(() => itensPedido.value.filter(i => i.quantidade !== null && i.quantidade > 0).length)

const progressoPercent = computed(() => {
  if (itensPedido.value.length === 0) return 0
  return Math.round((itensPreenchidos.value / itensPedido.value.length) * 100)
})

// Revisão (fase 3)
const observacaoPedido = ref('')
const salvandoRascunho = ref(false)
const salvandoWhatsApp = ref(false)
const resumoSalvamento = ref('')

const itensParaSalvar = computed(() => {
  return itensPedido.value.filter(i => i.quantidade !== null && i.quantidade > 0)
})


// ==========================================
// HISTÓRICO
// ==========================================
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const filtroBusca = ref('')
const pageHistorico = ref(1)
const pageSizeHistorico = ref(10)
const expandedPedidos = ref(new Set<string>())

const pedidosFiltrados = computed(() => {
  let result = todosPedidos.value
  if (filtroDataInicio.value) result = result.filter(p => p.data >= filtroDataInicio.value)
  if (filtroDataFim.value) result = result.filter(p => p.data <= filtroDataFim.value)
  if (filtroBusca.value) {
    const term = filtroBusca.value.toLowerCase()
    result = result.filter(p =>
      p.observacao?.toLowerCase().includes(term) ||
      p.itens?.some(i => i.produto?.nome?.toLowerCase().includes(term))
    )
  }
  return result
})

const pedidosEnviados = computed(() => pedidosFiltrados.value.filter(p => p.status === 'enviado' || p.status === 'concluido').length)
const pedidosRascunho = computed(() => pedidosFiltrados.value.filter(p => p.status === 'rascunho').length)

const pedidosPaginados = computed(() => {
  const start = (pageHistorico.value - 1) * pageSizeHistorico.value
  return pedidosFiltrados.value.slice(start, start + pageSizeHistorico.value)
})

const togglePedido = (id: string) => {
  expandedPedidos.value.has(id) ? expandedPedidos.value.delete(id) : expandedPedidos.value.add(id)
}

// ==========================================
// MODAIS AUXILIARES
// ==========================================
const modalSairOpen = ref(false)
const modalSucessoOpen = ref(false)
const modalExcluirOpen = ref(false)
const pedidoParaExcluir = ref<Pedido | null>(null)
const excluindo = ref(false)

// ==========================================
// AÇÕES
// ==========================================

const carregarDadosBase = async () => {
  try {
    const [g, s, p] = await Promise.all([
      getGrupos(), getSubgrupos(), getProdutos()
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
    todosPedidos.value = await getPedidos()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar pedidos', color: 'red' })
  } finally {
    loadingHistorico.value = false
  }
}

const limparFiltros = () => {
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  filtroBusca.value = ''
}

const abrirModalSetup = () => {
  setupData.value = new Date().toISOString().split('T')[0]
  setupGrupoId.value = ''
  setupSubgrupoId.value = ''
  selecoes.value = []
  faseModal.value = 1
  itensPedido.value = []
  buscaMontagem.value = ''
  observacaoPedido.value = ''
  modalPedidoOpen.value = true
}

const iniciarMontagem = () => {
  itensPedido.value = produtosParaMontar.value.map(p => ({
    produto_id: p.id,
    nome: p.nome,
    unidade_sigla: p.unidade?.sigla || '',
    subgrupo_nome: p.subgrupo?.nome || '',
    quantidade: null,
    fornecedor_id: '',
    observacao: ''
  })).sort((a, b) => a.subgrupo_nome.localeCompare(b.subgrupo_nome) || a.nome.localeCompare(b.nome))

  buscaMontagem.value = ''
  faseModal.value = 2
}

const tentarFecharModal = () => {
  if (itensPreenchidos.value > 0) {
    modalSairOpen.value = true
  } else {
    modalPedidoOpen.value = false
  }
}

const descartarEFechar = () => {
  modalSairOpen.value = false
  modalPedidoOpen.value = false
  itensPedido.value = []
}

const salvarPedido = async (status: string) => {
  const isWhatsApp = status === 'enviado'
  if (isWhatsApp) salvandoWhatsApp.value = true
  else salvandoRascunho.value = true

  try {
    const itens = itensParaSalvar.value.map(item => ({
      produto_id: item.produto_id,
      quantidade: item.quantidade!,
      observacao: item.observacao || undefined
    }))

    await createPedido(
      {
        data: setupData.value,
        observacao: observacaoPedido.value.trim() || undefined,
        status
      },
      itens
    )

    resumoSalvamento.value = `Pedido com ${itens.length} ${itens.length === 1 ? 'item' : 'itens'} salvo como ${status === 'enviado' ? 'enviado' : 'rascunho'}.`

    toast.add({ title: 'Sucesso', description: 'Pedido salvo com sucesso!', color: 'green' })
    await carregarHistorico()
    modalPedidoOpen.value = false
    itensPedido.value = []
    modalSucessoOpen.value = true
    return true
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar pedido', color: 'red' })
    return false
  } finally {
    salvandoRascunho.value = false
    salvandoWhatsApp.value = false
  }
}

const montarTextoWhatsApp = (pedido?: Pedido) => {
  const empresa = empresaAtiva?.value?.nome || ''
  const data = pedido ? formatDate(pedido.data) : formatDate(setupData.value)
  const obs = pedido ? (pedido.observacao || '') : observacaoPedido.value.trim()

  const itens = pedido
    ? (pedido.itens || []).map((item, idx) =>
        `${idx + 1}. ${item.produto?.nome} — ${formatNumber(item.quantidade)} ${item.produto?.unidade?.sigla || ''}`
      )
    : itensParaSalvar.value.map((item, idx) =>
        `${idx + 1}. ${item.nome} — ${formatNumber(item.quantidade!)} ${item.unidade_sigla}`
      )

  let texto = `*PEDIDO DE COMPRA*\n`
  texto += `Empresa: ${empresa}\n`
  texto += `Data: ${data}\n\n`
  texto += `*ITENS:*\n`
  texto += itens.join('\n')
  texto += `\n\nTotal: ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`
  if (obs) texto += `\nObs: ${obs}`

  return texto
}

const abrirWhatsApp = (texto: string) => {
  const encoded = encodeURIComponent(texto)
  window.open(`https://wa.me/?text=${encoded}`, '_blank')
}

const salvarEEnviarWhatsApp = async () => {
  const texto = montarTextoWhatsApp()
  const sucesso = await salvarPedido('enviado')
  if (sucesso) abrirWhatsApp(texto)
}

const enviarWhatsApp = async (pedido: Pedido) => {
  const texto = montarTextoWhatsApp(pedido)
  abrirWhatsApp(texto)
  if (pedido.status === 'rascunho') {
    try {
      await updatePedidoStatus(pedido.id, 'enviado')
      await carregarHistorico()
    } catch { /* silently ignore */ }
  }
}

const imprimirPedido = (pedido: Pedido) => {
  const empresa = empresaAtiva?.value?.nome || ''
  const dataPedido = formatDate(pedido.data)
  const itens = pedido.itens || []

  const linhas = itens.map((item, idx) => {
    return `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">${item.produto?.nome || '-'}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.produto?.unidade?.sigla || ''}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatNumber(item.quantidade)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">${item.observacao || ''}</td>
      </tr>
    `
  }).join('')

  const html = `
    <html>
    <head>
      <title>Pedido de Compra - ${dataPedido}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; color: #111827; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .obs { margin-top: 16px; font-size: 13px; color: #374151; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Pedido de Compra</h1>
      <div class="subtitle">${empresa} · ${dataPedido} · ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th>Produto</th>
            <th class="text-center" style="width: 50px;">Un.</th>
            <th class="text-right" style="width: 100px;">Quantidade</th>
            <th style="width: 150px;">Obs.</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
      ${pedido.observacao ? `<div class="obs"><strong>Observação:</strong> ${pedido.observacao}</div>` : ''}
      <div class="footer">Guardião do CMV - Pedido de Compra</div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

const marcarEnviado = async (pedido: Pedido) => {
  try {
    await updatePedidoStatus(pedido.id, 'enviado')
    toast.add({ title: 'Status atualizado', description: 'Pedido marcado como enviado', color: 'green' })
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao atualizar status', color: 'red' })
  }
}

const marcarConcluido = async (pedido: Pedido) => {
  try {
    await updatePedidoStatus(pedido.id, 'concluido')
    toast.add({ title: 'Status atualizado', description: 'Pedido marcado como concluído', color: 'green' })
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao atualizar status', color: 'red' })
  }
}

const novoPedidoAposSucesso = () => {
  modalSucessoOpen.value = false
  abrirModalSetup()
}

const confirmarExclusao = (pedido: Pedido) => {
  pedidoParaExcluir.value = pedido
  modalExcluirOpen.value = true
}

const excluirConfirmado = async () => {
  if (!pedidoParaExcluir.value) return
  try {
    excluindo.value = true
    await removePedido(pedidoParaExcluir.value.id)
    toast.add({ title: 'Sucesso', description: 'Pedido excluído', color: 'green' })
    modalExcluirOpen.value = false
    expandedPedidos.value.clear()
    await carregarHistorico()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir pedido', color: 'red' })
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
