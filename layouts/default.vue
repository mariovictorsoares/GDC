<template>
  <div class="min-h-screen bg-operacao-50">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-operacao-200 transform transition-all duration-200 ease-in-out lg:translate-x-0 flex flex-col',
        sidebarCollapsed ? 'w-[68px]' : 'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo + Toggle -->
      <div
        class="relative flex items-center h-16 border-b border-operacao-200 bg-white flex-shrink-0"
        :class="sidebarCollapsed ? 'justify-center px-2' : 'justify-center px-4'"
      >
        <img
          v-if="!sidebarCollapsed"
          src="/logo.png"
          alt="Guardião do CMV"
          class="h-14 w-auto object-contain"
        />
        <img
          v-else
          src="/favicon.png"
          alt="Guardião do CMV"
          class="w-9 h-9 object-contain"
        />
        <button
          class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-operacao-200 shadow-sm flex items-center justify-center text-operacao-400 hover:text-operacao-600 hover:bg-operacao-50 transition-colors z-10 hidden lg:flex"
          @click="toggleCollapse"
        >
          <UIcon
            :name="sidebarCollapsed ? 'i-heroicons-chevron-right-20-solid' : 'i-heroicons-chevron-left-20-solid'"
            class="w-3.5 h-3.5"
          />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden" :class="sidebarCollapsed ? 'py-3' : 'p-4 pb-0'">
        <!-- Dashboard + Empresas -->
        <div :class="sidebarCollapsed ? 'flex flex-col items-center space-y-1' : 'space-y-1'">
          <div v-for="item in menuDashboard" :key="item.to">
            <div v-if="sidebarCollapsed" class="flex justify-center">
              <UTooltip :text="item.label" :popper="{ placement: 'right' }">
                <NuxtLink
                  :to="item.to"
                  class="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                  :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-400 hover:bg-operacao-100'"
                >
                  <UIcon :name="item.icon" class="w-5 h-5" />
                </NuxtLink>
              </UTooltip>
            </div>
            <NuxtLink
              v-else
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-600 hover:bg-operacao-100'"
            >
              <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Cadastros -->
        <div :class="sidebarCollapsed ? 'mt-1' : 'mt-1'">
          <div :class="sidebarCollapsed ? 'flex flex-col items-center space-y-1' : 'space-y-1'">
            <div v-for="item in menuCadastros" :key="item.to">
              <div v-if="sidebarCollapsed" class="flex justify-center">
                <UTooltip :text="item.label" :popper="{ placement: 'right' }">
                  <NuxtLink
                    :to="item.to"
                    class="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                    :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-400 hover:bg-operacao-100'"
                  >
                    <UIcon :name="item.icon" class="w-5 h-5" />
                  </NuxtLink>
                </UTooltip>
              </div>
              <NuxtLink
                v-else
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-600 hover:bg-operacao-100'"
              >
                <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </div>

          </div>
        </div>

        <!-- Relatórios (collapsible) -->
        <div class="mt-1">
          <!-- Header toggle -->
          <div v-if="sidebarCollapsed" class="flex justify-center">
            <UTooltip text="Relatórios" :popper="{ placement: 'right' }">
              <button
                class="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                :class="isRelatorioActive ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-400 hover:bg-operacao-100'"
                @click="toggleRelatorios"
              >
                <UIcon name="i-heroicons-document-chart-bar" class="w-5 h-5" />
              </button>
            </UTooltip>
          </div>
          <button
            v-else
            class="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="isRelatorioActive && !relatoriosOpen ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-600 hover:bg-operacao-100'"
            @click="toggleRelatorios"
          >
            <span class="flex items-center gap-3">
              <UIcon name="i-heroicons-document-chart-bar" class="w-5 h-5 flex-shrink-0" />
              <span>Relatórios</span>
            </span>
            <UIcon
              name="i-heroicons-chevron-down"
              class="w-4 h-4 transition-transform duration-200"
              :class="relatoriosOpen ? '' : '-rotate-90'"
            />
          </button>

          <!-- Sub-items (animated) -->
          <div
            v-if="!sidebarCollapsed"
            class="grid transition-[grid-template-rows] duration-200 ease-in-out"
            :class="relatoriosOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="overflow-hidden">
              <div class="mt-0.5 space-y-0.5 pl-5">
                <NuxtLink
                  v-for="item in menuRelatorios"
                  :key="item.to"
                  :to="item.to"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-600 hover:bg-operacao-100'"
                >
                  <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin (super-admin only) -->
        <div v-if="isSuperAdmin" :class="sidebarCollapsed ? 'mt-1' : 'mt-1'">
          <div :class="sidebarCollapsed ? 'flex flex-col items-center space-y-1' : 'space-y-1'">
            <div v-for="item in menuAdmin" :key="item.to">
              <div v-if="sidebarCollapsed" class="flex justify-center">
                <UTooltip :text="item.label" :popper="{ placement: 'right' }">
                  <NuxtLink
                    :to="item.to"
                    class="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                    :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-400 hover:bg-operacao-100'"
                  >
                    <UIcon :name="item.icon" class="w-5 h-5" />
                  </NuxtLink>
                </UTooltip>
              </div>
              <NuxtLink
                v-else
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                :class="isActive(item.to) ? 'bg-guardian-50 text-guardian-700' : 'text-operacao-600 hover:bg-operacao-100'"
              >
                <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>

      </nav>

      <!-- Footer: Empresa + User -->
      <div class="border-t border-operacao-100 flex-shrink-0">
        <!-- Seletor de Empresa -->
        <div :class="sidebarCollapsed ? 'p-1.5 flex justify-center' : 'px-2.5 pt-2.5 pb-2'">
          <UPopover v-model:open="empresaPopoverOpen" :popper="{ placement: 'top-start' }">
            <button
              :class="[
                'group flex items-center rounded-lg transition-colors duration-150',
                sidebarCollapsed
                  ? 'justify-center p-1 hover:bg-operacao-100'
                  : 'w-full gap-2.5 px-2 py-1.5 hover:bg-operacao-50'
              ]"
            >
              <div
                v-if="empresaAtiva?.logo_url"
                class="flex-shrink-0 rounded-lg overflow-hidden"
                :class="sidebarCollapsed ? 'w-7 h-7' : 'w-8 h-8'"
              >
                <img
                  :src="empresaAtiva.logo_url"
                  :class="sidebarCollapsed ? 'w-7 h-7' : 'w-8 h-8'"
                  class="object-cover"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 bg-operacao-100 flex items-center justify-center rounded-lg"
                :class="sidebarCollapsed ? 'w-7 h-7' : 'w-8 h-8'"
              >
                <UIcon name="i-heroicons-building-storefront" class="text-operacao-400 w-4 h-4" />
              </div>
              <template v-if="!sidebarCollapsed">
                <div class="flex-1 min-w-0 text-left">
                  <p class="text-[13px] font-semibold text-operacao-800 truncate leading-none">{{ empresaAtiva?.nome || 'Sem empresa' }}</p>
                  <p class="text-[10px] text-operacao-400 leading-none mt-1">Empresa atual</p>
                </div>
                <div class="flex flex-col items-center text-operacao-300 group-hover:text-operacao-400 transition-colors flex-shrink-0">
                  <UIcon name="i-heroicons-chevron-up" class="w-2.5 h-2.5" />
                  <UIcon name="i-heroicons-chevron-down" class="w-2.5 h-2.5 -mt-0.5" />
                </div>
              </template>
            </button>

            <template #panel>
              <div class="p-1.5 w-72">
                <p class="px-2.5 py-1.5 text-[10px] font-semibold text-operacao-400 uppercase tracking-wider">Suas empresas</p>
                <div
                  v-for="emp in listaEmpresas"
                  :key="emp.id"
                  class="group flex items-center gap-2 w-full px-2.5 py-2 rounded-lg transition-colors"
                  :class="emp.id === empresaAtiva?.id ? 'bg-guardian-50' : 'hover:bg-operacao-50'"
                >
                  <button
                    class="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    :class="emp.id === empresaAtiva?.id ? 'text-guardian-700' : 'text-operacao-600'"
                    @click="trocarEmpresa(emp)"
                  >
                    <div v-if="emp.logo_url" class="flex-shrink-0 w-7 h-7 rounded-lg overflow-hidden">
                      <img :src="emp.logo_url" class="w-7 h-7 object-cover" />
                    </div>
                    <div v-else class="flex-shrink-0 w-7 h-7 rounded-lg bg-operacao-100 flex items-center justify-center">
                      <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 text-operacao-400" />
                    </div>
                    <span class="text-[13px] font-medium truncate flex-1">{{ emp.nome }}</span>
                    <UIcon
                      v-if="emp.id === empresaAtiva?.id"
                      name="i-heroicons-check-circle-solid"
                      class="w-3.5 h-3.5 text-guardian-500 flex-shrink-0"
                    />
                  </button>
                  <!-- Edit / Delete actions -->
                  <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      class="p-1 rounded hover:bg-operacao-200 text-operacao-400 hover:text-operacao-600 transition-colors"
                      title="Editar"
                      @click.stop="abrirModalEditarEmpresa(emp)"
                    >
                      <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      v-if="emp.id !== empresaAtiva?.id"
                      class="p-1 rounded hover:bg-red-100 text-operacao-400 hover:text-red-500 transition-colors"
                      title="Excluir"
                      @click.stop="confirmarDeletarEmpresa(emp)"
                    >
                      <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Divider + Nova Empresa -->
                <div class="mt-1.5 pt-1.5 border-t border-operacao-100">
                  <button
                    class="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left text-guardian-600 hover:bg-guardian-50 transition-colors"
                    @click="abrirModalNovaEmpresa"
                  >
                    <div class="flex-shrink-0 w-7 h-7 rounded-lg border-2 border-dashed border-guardian-300 flex items-center justify-center">
                      <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                    </div>
                    <span class="text-[13px] font-medium">Nova Empresa</span>
                  </button>
                </div>
              </div>
            </template>
          </UPopover>
        </div>

        <!-- Divider -->
        <div :class="sidebarCollapsed ? 'mx-2' : 'mx-3'" class="border-t border-operacao-100" />

        <!-- Assinatura / Trial info -->
        <div v-if="showAssinaturaBanner && !sidebarCollapsed" class="px-2.5 pt-2">
          <NuxtLink
            to="/assinatura"
            class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors"
            :class="sidebarAssinaturaStyle.bgClass"
          >
            <div
              class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
              :class="sidebarAssinaturaStyle.iconBgClass"
            >
              <UIcon :name="sidebarAssinaturaStyle.icon" class="w-3.5 h-3.5" :class="sidebarAssinaturaStyle.iconClass" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold truncate" :class="sidebarAssinaturaStyle.textClass">
                {{ sidebarAssinaturaLabel }}
              </p>
              <p class="text-[10px] truncate" :class="sidebarAssinaturaStyle.subtextClass">
                {{ sidebarAssinaturaSub }}
              </p>
            </div>
          </NuxtLink>
        </div>
        <div v-else-if="showAssinaturaBanner && sidebarCollapsed" class="flex justify-center pt-2 px-1.5">
          <UTooltip :text="sidebarAssinaturaLabel" :popper="{ placement: 'right' }">
            <NuxtLink
              to="/assinatura"
              class="w-7 h-7 rounded-lg flex items-center justify-center"
              :class="sidebarAssinaturaStyle.iconBgClass"
            >
              <UIcon :name="sidebarAssinaturaStyle.icon" class="w-3.5 h-3.5" :class="sidebarAssinaturaStyle.iconClass" />
            </NuxtLink>
          </UTooltip>
        </div>

        <!-- Divider assinatura/user -->
        <div v-if="showAssinaturaBanner" :class="sidebarCollapsed ? 'mx-2 mt-2' : 'mx-3 mt-2'" class="border-t border-operacao-100" />

        <!-- Linha do User -->
        <div :class="sidebarCollapsed ? 'p-1.5 flex justify-center' : 'px-2.5 pt-2 pb-2.5'">
          <div :class="sidebarCollapsed ? 'flex items-center justify-center' : 'flex items-center gap-2.5 px-2 py-1'">
            <template v-if="sidebarCollapsed">
              <UTooltip :text="nomeCompletoUsuario" :popper="{ placement: 'right' }">
                <button
                  class="w-7 h-7 rounded-full bg-guardian-600 text-white flex items-center justify-center text-[10px] font-bold hover:ring-2 hover:ring-guardian-300 transition-all overflow-hidden"
                  @click="showPerfilModal = true"
                >
                  <img v-if="fotoPerfilUsuario" :src="fotoPerfilUsuario" class="w-7 h-7 object-cover" />
                  <span v-else>{{ iniciaisUsuario }}</span>
                </button>
              </UTooltip>
            </template>
            <template v-else>
              <button
                class="flex-shrink-0 w-8 h-8 rounded-full bg-guardian-600 text-white flex items-center justify-center text-[11px] font-bold tracking-wide hover:ring-2 hover:ring-guardian-300 transition-all overflow-hidden"
                @click="showPerfilModal = true"
              >
                <img v-if="fotoPerfilUsuario" :src="fotoPerfilUsuario" class="w-8 h-8 object-cover" />
                <span v-else>{{ iniciaisUsuario }}</span>
              </button>
              <button class="flex-1 min-w-0 text-left" @click="showPerfilModal = true">
                <p class="text-[13px] font-semibold text-operacao-800 truncate leading-none uppercase hover:text-guardian-700 transition-colors">{{ nomeCompletoUsuario }}</p>
                <p v-if="sidebarPlanoLabel" class="text-[10px] mt-1 truncate leading-none" :class="sidebarPlanoLabelClass">{{ sidebarPlanoLabel }}</p>
              </button>
              <button
                v-if="user"
                class="flex-shrink-0 w-7 h-7 flex items-center justify-center text-operacao-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                title="Sair"
                @click="logout"
              >
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
              </button>
            </template>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-operacao-600 bg-opacity-50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Main content -->
    <div :class="sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64'" class="transition-all duration-200">
      <!-- Mobile menu button -->
      <button
        class="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg text-operacao-500 bg-white shadow-md hover:bg-operacao-100"
        @click="sidebarOpen = !sidebarOpen"
      >
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>

      <!-- Page content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <!-- Modal: Editar Perfil -->
    <UModal
      v-model="showPerfilModal"
      :ui="{
        width: 'sm:max-w-lg',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-operacao-800">Configurações</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showPerfilModal = false"
            />
          </div>
          <!-- Tabs -->
          <div class="flex gap-1 border-b border-operacao-100 -mx-1">
            <button
              class="px-4 py-2 text-sm font-medium transition-colors relative"
              :class="perfilModalTab === 0 ? 'text-guardian-700' : 'text-operacao-400 hover:text-operacao-600'"
              @click="perfilModalTab = 0"
            >
              <span class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-user-circle" class="w-4 h-4" />
                Perfil
              </span>
              <div
                v-if="perfilModalTab === 0"
                class="absolute bottom-0 left-2 right-2 h-0.5 bg-guardian-600 rounded-full"
              />
            </button>
            <button
              class="px-4 py-2 text-sm font-medium transition-colors relative"
              :class="perfilModalTab === 1 ? 'text-guardian-700' : 'text-operacao-400 hover:text-operacao-600'"
              @click="perfilModalTab = 1; carregarDadosAssinatura()"
            >
              <span class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-credit-card" class="w-4 h-4" />
                Assinatura
              </span>
              <div
                v-if="perfilModalTab === 1"
                class="absolute bottom-0 left-2 right-2 h-0.5 bg-guardian-600 rounded-full"
              />
            </button>
          </div>
        </template>

        <!-- ==================== TAB: PERFIL ==================== -->
        <form v-if="perfilModalTab === 0" @submit.prevent="salvarPerfil" class="space-y-4">
          <!-- Foto de perfil -->
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="relative group w-20 h-20 rounded-full bg-guardian-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0 hover:ring-4 hover:ring-guardian-200 transition-all"
              @click="($refs.avatarInput as HTMLInputElement)?.click()"
            >
              <img v-if="perfilForm.foto_url" :src="perfilForm.foto_url" class="w-20 h-20 object-cover" />
              <span v-else>{{ iniciaisUsuario }}</span>
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <UIcon name="i-heroicons-camera" class="w-6 h-6 text-white" />
              </div>
              <div v-if="uploadingAvatar" class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-white animate-spin" />
              </div>
            </button>
            <input
              ref="avatarInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="onAvatarSelected"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-operacao-600">Foto de perfil</p>
              <p class="text-xs text-operacao-400 mt-0.5">Clique na imagem para alterar</p>
              <p class="text-[10px] text-operacao-400">PNG, JPG ou WebP até 2MB</p>
            </div>
          </div>

          <!-- Nome -->
          <UFormGroup label="Nome Completo" required>
            <UInput
              v-model="perfilForm.nome"
              placeholder="Seu nome completo"
              size="lg"
              icon="i-heroicons-user"
            />
          </UFormGroup>

          <!-- Endereço -->
          <div class="pt-2">
            <p class="text-sm font-semibold text-operacao-600 mb-3 flex items-center gap-1.5">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-operacao-400" />
              Endereço
            </p>

            <div class="grid grid-cols-3 gap-3">
              <UFormGroup label="CEP">
                <UInput
                  v-model="perfilForm.cep"
                  placeholder="00000-000"
                  size="sm"
                  maxlength="9"
                  @input="formatarCepInput"
                  @blur="buscarCep"
                />
              </UFormGroup>
              <UFormGroup label="Cidade" class="col-span-2">
                <UInput
                  v-model="perfilForm.cidade"
                  placeholder="Cidade"
                  size="sm"
                />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-4 gap-3 mt-3">
              <UFormGroup label="Logradouro" class="col-span-2">
                <UInput
                  v-model="perfilForm.logradouro"
                  placeholder="Rua, Av..."
                  size="sm"
                />
              </UFormGroup>
              <UFormGroup label="Número">
                <UInput
                  v-model="perfilForm.numero"
                  placeholder="Nº"
                  size="sm"
                />
              </UFormGroup>
              <UFormGroup label="Estado">
                <UInput
                  v-model="perfilForm.estado"
                  placeholder="UF"
                  size="sm"
                  maxlength="2"
                />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-3">
              <UFormGroup label="Bairro">
                <UInput
                  v-model="perfilForm.bairro"
                  placeholder="Bairro"
                  size="sm"
                />
              </UFormGroup>
              <UFormGroup label="Complemento">
                <UInput
                  v-model="perfilForm.complemento"
                  placeholder="Apto, Sala..."
                  size="sm"
                />
              </UFormGroup>
            </div>
          </div>
        </form>

        <!-- ==================== TAB: ASSINATURA ==================== -->
        <div v-else-if="perfilModalTab === 1" class="space-y-5">
          <!-- Status Card -->
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              :class="assinaturaStatusIcon.bgClass"
            >
              <UIcon :name="assinaturaStatusIcon.icon" class="w-5 h-5" :class="assinaturaStatusIcon.iconClass" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <h4 class="text-sm font-bold text-operacao-800">
                  {{ assinaturaData?.plano?.nome || 'Período de teste' }}
                </h4>
                <span
                  class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full"
                  :class="assinaturaStatusBadge.class"
                >
                  {{ assinaturaStatusBadge.label }}
                </span>
              </div>
              <p class="text-xs text-operacao-400">
                <template v-if="subscriptionState.state === 'active'">
                  Assinatura ativa.
                  <span v-if="assinaturaData?.plano">R$ {{ formatarPrecoAssinatura(assinaturaData.plano.preco_mensal) }}/mês</span>
                </template>
                <template v-else-if="isTrial">
                  {{ subscriptionState.diasRestantes }} dia{{ subscriptionState.diasRestantes! > 1 ? 's' : '' }} restantes no teste grátis.
                </template>
                <template v-else-if="subscriptionState.state === 'grace'">
                  Teste expirado. Assine para continuar.
                </template>
                <template v-else-if="subscriptionState.state === 'past_due'">
                  Pagamento pendente.
                </template>
                <template v-else-if="subscriptionState.state === 'cancelled'">
                  Assinatura cancelada.
                </template>
                <template v-else>
                  Acesso bloqueado.
                </template>
              </p>
            </div>
          </div>

          <!-- Plano atual (se ativo) -->
          <div v-if="assinaturaData?.plano" class="bg-operacao-50 rounded-xl p-4 space-y-3">
            <p class="text-[11px] font-semibold text-operacao-400 uppercase tracking-wider">Detalhes do plano</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[11px] text-operacao-400">Plano</p>
                <p class="text-sm font-semibold text-operacao-800">{{ assinaturaData.plano.nome }}</p>
              </div>
              <div>
                <p class="text-[11px] text-operacao-400">Valor mensal</p>
                <p class="text-sm font-semibold text-operacao-800">R$ {{ formatarPrecoAssinatura(assinaturaData.plano.preco_mensal) }}</p>
              </div>
            </div>
            <!-- Recursos -->
            <div v-if="assinaturaData.plano.recursos?.length" class="pt-2 border-t border-operacao-200/60">
              <p class="text-[11px] text-operacao-400 mb-2">Recursos incluídos</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="recurso in assinaturaData.plano.recursos"
                  :key="recurso"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-guardian-50 text-guardian-700 rounded-md"
                >
                  <UIcon name="i-heroicons-check" class="w-3 h-3" />
                  {{ recurso }}
                </span>
              </div>
            </div>
          </div>

          <!-- Ações -->
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              v-if="assinaturaData?.stripe_customer_id"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-operacao-800 text-white hover:bg-operacao-900 transition-colors"
              :disabled="abrindoPortal"
              @click="handleAbrirPortalModal"
            >
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
              {{ abrindoPortal ? 'Abrindo...' : 'Gerenciar assinatura' }}
            </button>
            <NuxtLink
              v-if="!isAssinaturaActive || subscriptionState.state === 'cancelled'"
              to="/assinatura"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-guardian-600 text-white hover:bg-guardian-700 transition-colors"
              @click="showPerfilModal = false"
            >
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
              {{ isAssinaturaActive ? 'Trocar de plano' : 'Assinar plano' }}
            </NuxtLink>
          </div>
        </div>

        <template #footer>
          <!-- Footer só para aba Perfil -->
          <div v-if="perfilModalTab === 0" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="showPerfilModal = false">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              class="w-full sm:w-auto"
              :loading="salvandoPerfil"
              :disabled="!perfilForm.nome.trim()"
              @click="salvarPerfil"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              Salvar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Nova / Editar Empresa -->
    <UModal
      v-model="showEmpresaModal"
      :ui="{
        width: 'sm:max-w-lg',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-guardian-100 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-building-storefront" class="w-5 h-5 text-guardian-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-operacao-800">
                  {{ empresaEditando ? 'Editar Empresa' : 'Nova Empresa' }}
                </h3>
                <p class="text-xs text-operacao-400">
                  {{ empresaEditando ? 'Atualize os dados da empresa' : 'Preencha os dados para criar uma empresa' }}
                </p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showEmpresaModal = false"
            />
          </div>
        </template>

        <form @submit.prevent="salvarEmpresa" class="space-y-4">
          <UFormGroup label="Nome da Empresa" required>
            <UInput
              v-model="empresaForm.nome"
              placeholder="Nome da empresa"
              size="lg"
              autofocus
            />
          </UFormGroup>

          <UFormGroup label="CNPJ">
            <UInput
              v-model="empresaCnpjFormatado"
              placeholder="00.000.000/0000-00"
              size="lg"
              maxlength="18"
            />
          </UFormGroup>

          <!-- Upload de Logo -->
          <UFormGroup label="Logo da Empresa">
            <div class="flex items-center gap-4">
              <div
                class="relative w-16 h-16 rounded-xl bg-operacao-50 border-2 border-dashed border-operacao-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-guardian-300 hover:bg-guardian-50/30 transition-colors group"
                @click="($refs.logoInput as HTMLInputElement)?.click()"
              >
                <img v-if="empresaLogoPreview" :src="empresaLogoPreview" class="w-16 h-16 object-cover rounded-xl" />
                <UIcon v-else name="i-heroicons-photo" class="w-6 h-6 text-operacao-300 group-hover:text-guardian-400 transition-colors" />
                <div v-if="empresaLogoPreview" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <UButton
                    color="gray"
                    variant="soft"
                    size="xs"
                    :loading="uploadingLogo"
                    @click="($refs.logoInput as HTMLInputElement)?.click()"
                  >
                    <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 mr-1" />
                    {{ empresaLogoPreview ? 'Trocar' : 'Enviar' }}
                  </UButton>
                  <UButton
                    v-if="empresaLogoPreview"
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="removerLogoEmpresa"
                  >
                    Remover
                  </UButton>
                </div>
                <p class="text-[11px] text-operacao-400 mt-1.5">PNG, JPG ou WebP até 2MB</p>
              </div>
              <input
                ref="logoInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="onLogoSelected"
              />
            </div>
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="showEmpresaModal = false">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              class="w-full sm:w-auto"
              :loading="salvandoEmpresa"
              :disabled="!empresaForm.nome.trim()"
              @click="salvarEmpresa"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ empresaEditando ? 'Salvar Alterações' : 'Criar Empresa' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Confirmar exclusão de empresa -->
    <UModal
      v-model="showConfirmDeleteEmpresa"
      :ui="{
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-trash" class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-operacao-800">Confirmar Exclusão</h3>
                <p class="text-xs text-operacao-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showConfirmDeleteEmpresa = false"
            />
          </div>
        </template>

        <p class="text-operacao-500">
          Tem certeza que deseja excluir a empresa <strong>{{ empresaParaDeletar?.nome }}</strong>?
        </p>
        <div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <p class="text-sm text-red-600">
            Todos os dados vinculados a esta empresa (produtos, entradas, saídas, etc.) serão removidos permanentemente.
          </p>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="showConfirmDeleteEmpresa = false">
              Cancelar
            </UButton>
            <UButton
              color="red"
              class="w-full sm:w-auto"
              :loading="deletandoEmpresa"
              @click="executarDeletarEmpresa"
            >
              Excluir Empresa
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Empresa } from '~/types'

const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const user = useSupabaseUser()
const client = useSupabaseClient()
const toast = useToast()

// Multi-empresa
const {
  empresaAtiva,
  empresas: listaEmpresas,
  carregarEmpresaAtiva,
  setEmpresaAtiva,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  getEmpresas
} = useEmpresa()

// Assinatura
const {
  isSuperAdmin,
  verificarSuperAdmin,
  assinatura: assinaturaData,
  subscriptionState,
  isTrial,
  isActive: isAssinaturaActive,
  carregarAssinatura,
  carregarPlanos,
  planos: planosDisponiveis,
  iniciarCheckout,
  abrirPortal,
  showBanner: showAssinaturaBanner
} = useAssinatura()
verificarSuperAdmin()

// Aba do modal de perfil
const perfilModalTab = ref(0) // 0 = Perfil, 1 = Assinatura
const assinandoPlano = ref<string | null>(null)
const abrindoPortal = ref(false)

// Computed helpers para aba Assinatura
const assinaturaStatusIcon = computed(() => {
  const state = subscriptionState.value.state
  const map: Record<string, { icon: string; bgClass: string; iconClass: string }> = {
    active: { icon: 'i-heroicons-check-circle', bgClass: 'bg-green-100', iconClass: 'text-green-600' },
    trial: { icon: 'i-heroicons-clock', bgClass: 'bg-blue-100', iconClass: 'text-blue-600' },
    trial_warning: { icon: 'i-heroicons-clock', bgClass: 'bg-amber-100', iconClass: 'text-amber-600' },
    grace: { icon: 'i-heroicons-exclamation-triangle', bgClass: 'bg-amber-100', iconClass: 'text-amber-600' },
    past_due: { icon: 'i-heroicons-credit-card', bgClass: 'bg-orange-100', iconClass: 'text-orange-600' },
    cancelled: { icon: 'i-heroicons-x-circle', bgClass: 'bg-red-100', iconClass: 'text-red-600' },
  }
  return map[state] || { icon: 'i-heroicons-lock-closed', bgClass: 'bg-operacao-100', iconClass: 'text-operacao-600' }
})

const assinaturaStatusBadge = computed(() => {
  const state = subscriptionState.value.state
  const map: Record<string, { label: string; class: string }> = {
    active: { label: 'Ativa', class: 'bg-green-100 text-green-700' },
    trial: { label: 'Teste grátis', class: 'bg-blue-100 text-blue-700' },
    trial_warning: { label: 'Teste expirando', class: 'bg-amber-100 text-amber-700' },
    grace: { label: 'Expirado', class: 'bg-amber-100 text-amber-700' },
    past_due: { label: 'Pagamento pendente', class: 'bg-orange-100 text-orange-700' },
    cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-700' },
    blocked: { label: 'Bloqueada', class: 'bg-red-100 text-red-700' },
  }
  return map[state] || { label: state, class: 'bg-operacao-100 text-operacao-700' }
})

const formatarPrecoAssinatura = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const carregarDadosAssinatura = async () => {
  await carregarAssinatura()
}

// Sidebar: label do plano abaixo do nome
const sidebarPlanoLabel = computed(() => {
  const state = subscriptionState.value.state
  if (state === 'active') return assinaturaData.value?.plano?.nome || 'Plano ativo'
  if (state === 'trial' || state === 'trial_warning') return 'Teste grátis'
  if (state === 'grace') return 'Teste expirado'
  if (state === 'past_due') return 'Pgto. pendente'
  if (state === 'cancelled') return 'Cancelada'
  if (state === 'blocked') return 'Bloqueada'
  return ''
})

const sidebarPlanoLabelClass = computed(() => {
  const state = subscriptionState.value.state
  if (state === 'active') return 'text-green-600'
  if (state === 'trial') return 'text-blue-500'
  if (state === 'trial_warning') return 'text-amber-500'
  if (state === 'grace' || state === 'cancelled' || state === 'blocked') return 'text-red-500'
  if (state === 'past_due') return 'text-orange-500'
  return 'text-operacao-400'
})

// Sidebar: card de assinatura/trial
const sidebarAssinaturaLabel = computed(() => {
  const state = subscriptionState.value.state
  const dias = subscriptionState.value.diasRestantes
  if (state === 'trial') return `Teste grátis — ${dias} dia${dias! > 1 ? 's' : ''}`
  if (state === 'trial_warning') return `Teste expira em ${dias} dia${dias! > 1 ? 's' : ''}!`
  if (state === 'grace') return 'Teste expirado'
  if (state === 'past_due') return 'Pagamento pendente'
  if (state === 'cancelled') return 'Assinatura cancelada'
  return ''
})

const sidebarAssinaturaSub = computed(() => {
  const state = subscriptionState.value.state
  if (state === 'trial') return 'Assinar plano'
  if (state === 'trial_warning') return 'Assinar agora'
  if (state === 'grace') return 'Escolher plano'
  if (state === 'past_due') return 'Atualizar pagamento'
  if (state === 'cancelled') return 'Reativar'
  return ''
})

const sidebarAssinaturaStyle = computed(() => {
  const state = subscriptionState.value.state
  if (state === 'trial') {
    return {
      bgClass: 'bg-blue-50/80 hover:bg-blue-100/80',
      iconBgClass: 'bg-blue-100',
      icon: 'i-heroicons-sparkles',
      iconClass: 'text-blue-600',
      textClass: 'text-blue-800',
      subtextClass: 'text-blue-500',
    }
  }
  if (state === 'trial_warning') {
    return {
      bgClass: 'bg-amber-50/80 hover:bg-amber-100/80',
      iconBgClass: 'bg-amber-100',
      icon: 'i-heroicons-clock',
      iconClass: 'text-amber-600',
      textClass: 'text-amber-800',
      subtextClass: 'text-amber-500',
    }
  }
  if (state === 'grace' || state === 'cancelled') {
    return {
      bgClass: 'bg-red-50/80 hover:bg-red-100/80',
      iconBgClass: 'bg-red-100',
      icon: 'i-heroicons-exclamation-triangle',
      iconClass: 'text-red-600',
      textClass: 'text-red-800',
      subtextClass: 'text-red-500',
    }
  }
  if (state === 'past_due') {
    return {
      bgClass: 'bg-orange-50/80 hover:bg-orange-100/80',
      iconBgClass: 'bg-orange-100',
      icon: 'i-heroicons-credit-card',
      iconClass: 'text-orange-600',
      textClass: 'text-orange-800',
      subtextClass: 'text-orange-500',
    }
  }
  return {
    bgClass: 'bg-operacao-50 hover:bg-operacao-100',
    iconBgClass: 'bg-operacao-100',
    icon: 'i-heroicons-sparkles',
    iconClass: 'text-operacao-600',
    textClass: 'text-operacao-800',
    subtextClass: 'text-operacao-500',
  }
})

const handleAbrirPortalModal = async () => {
  abrindoPortal.value = true
  try {
    await abrirPortal()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Não foi possível abrir o portal.',
      color: 'red'
    })
  } finally {
    abrindoPortal.value = false
  }
}

const empresaPopoverOpen = ref(false)

// Empresa CRUD modal state
const showEmpresaModal = ref(false)
const empresaEditando = ref(false)
const empresaEditandoId = ref<string | null>(null)
const salvandoEmpresa = ref(false)
const uploadingLogo = ref(false)
const empresaLogoPreview = ref('')
const empresaLogoFile = ref<File | null>(null)
const empresaForm = reactive({ nome: '', cnpj: '', logo_url: '' })

// Delete confirmation
const showConfirmDeleteEmpresa = ref(false)
const empresaParaDeletar = ref<Empresa | null>(null)
const deletandoEmpresa = ref(false)

// Perfil do usuário
const showPerfilModal = ref(false)
const salvandoPerfil = ref(false)
const uploadingAvatar = ref(false)
const perfilForm = reactive({
  nome: '',
  foto_url: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: ''
})

const fotoPerfilUsuario = computed(() => {
  return user.value?.user_metadata?.foto_url || ''
})

watch(showPerfilModal, (abriu) => {
  if (abriu) {
    perfilModalTab.value = 0
    const meta = user.value?.user_metadata || {}
    perfilForm.nome = meta.nome || meta.name || meta.full_name || ''
    perfilForm.foto_url = meta.foto_url || ''
    perfilForm.cep = meta.cep || ''
    perfilForm.logradouro = meta.logradouro || ''
    perfilForm.numero = meta.numero || ''
    perfilForm.complemento = meta.complemento || ''
    perfilForm.bairro = meta.bairro || ''
    perfilForm.cidade = meta.cidade || ''
    perfilForm.estado = meta.estado || ''
  }
})

const onAvatarSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validações
  const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp']
  if (!tiposPermitidos.includes(file.type)) {
    toast.add({ title: 'Formato inválido', description: 'Use PNG, JPG ou WebP.', color: 'red' })
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.add({ title: 'Arquivo muito grande', description: 'Máximo de 2MB.', color: 'red' })
    return
  }

  const userId = user.value?.id
  if (!userId) return

  uploadingAvatar.value = true
  try {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${userId}/avatar_${Date.now()}.${ext}`

    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: true })

    if (uploadError) throw uploadError

    const { data: urlData } = client.storage
      .from('avatars')
      .getPublicUrl(fileName)

    perfilForm.foto_url = urlData.publicUrl
    toast.add({ title: 'Foto enviada!', color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro no upload', description: error.message || 'Não foi possível enviar a foto.', color: 'red' })
  } finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

const formatarCepInput = () => {
  let v = perfilForm.cep.replace(/\D/g, '')
  if (v.length > 8) v = v.slice(0, 8)
  if (v.length > 5) v = v.replace(/^(\d{5})(\d{1,3})/, '$1-$2')
  perfilForm.cep = v
}

const buscarCep = async () => {
  const cepLimpo = perfilForm.cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return
  try {
    const res = await $fetch<any>(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    if (!res.erro) {
      perfilForm.logradouro = res.logradouro || perfilForm.logradouro
      perfilForm.bairro = res.bairro || perfilForm.bairro
      perfilForm.cidade = res.localidade || perfilForm.cidade
      perfilForm.estado = res.uf || perfilForm.estado
    }
  } catch {
    // Silently ignore CEP lookup errors
  }
}

const salvarPerfil = async () => {
  if (!perfilForm.nome.trim()) return
  try {
    salvandoPerfil.value = true
    const { error } = await client.auth.updateUser({
      data: {
        nome: perfilForm.nome.trim(),
        foto_url: perfilForm.foto_url.trim(),
        cep: perfilForm.cep.trim(),
        logradouro: perfilForm.logradouro.trim(),
        numero: perfilForm.numero.trim(),
        complemento: perfilForm.complemento.trim(),
        bairro: perfilForm.bairro.trim(),
        cidade: perfilForm.cidade.trim(),
        estado: perfilForm.estado.trim().toUpperCase()
      }
    })
    if (error) throw error
    showPerfilModal.value = false
    toast.add({
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas com sucesso.',
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro ao salvar',
      description: error.message || 'Não foi possível atualizar o perfil.',
      color: 'red'
    })
  } finally {
    salvandoPerfil.value = false
  }
}

// Menu items
const menuDashboard = [
  { to: '/', icon: 'i-heroicons-home', label: 'Dashboard' }
]

const menuCadastros = [
  { to: '/cadastro/produtos', icon: 'i-heroicons-cube', label: 'Produtos' },
  { to: '/movimentos/controle-estoque', icon: 'i-heroicons-clipboard-document-list', label: 'Controle de Estoque', iconColor: 'text-guardian-500' },
  { to: '/movimentos/ajustes', icon: 'i-heroicons-clipboard-document-check', label: 'Contagem' },
  { to: '/compras', icon: 'i-heroicons-shopping-cart', label: 'Compras' }
]

const menuRelatorios = [
  { to: '/relatorios/cmv', icon: 'i-heroicons-calculator', label: 'CMV' },
  { to: '/relatorios/gestao-inventario', icon: 'i-heroicons-clipboard-document-list', label: 'Inventário' },
  { to: '/relatorios/giro-estoque', icon: 'i-heroicons-arrow-path', label: 'Giro de Estoque' },
  { to: '/relatorios/curva-abc', icon: 'i-heroicons-chart-bar', label: 'Curva ABC' },
  { to: '/relatorios/estoque-minimo?tab=1', icon: 'i-heroicons-currency-dollar', label: 'CMC Semanal' }
]

const relatoriosOpen = ref(false)

const menuAdmin = [
  { to: '/admin', icon: 'i-heroicons-cog-6-tooth', label: 'Painel Admin' }
]


const isActive = (fullPath: string) => {
  const [path, query] = fullPath.split('?')
  if (path === '/') {
    return route.path === '/'
  }
  if (query) {
    // Match path + specific query param
    const params = new URLSearchParams(query)
    const tab = params.get('tab')
    return route.path === path && route.query.tab === tab
  }
  if (route.path === path) return true
  return route.path.startsWith(path + '/')
}

const isRelatorioActive = computed(() => {
  return menuRelatorios.some(item => isActive(item.to))
})

// Auto-open when a relatório route is active
watch(isRelatorioActive, (active) => {
  if (active) relatoriosOpen.value = true
}, { immediate: true })

const toggleRelatorios = () => {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    if (import.meta.client) {
      localStorage.setItem('sidebar_collapsed', 'false')
    }
    relatoriosOpen.value = true
  } else {
    relatoriosOpen.value = !relatoriosOpen.value
  }
}

const toggleCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (import.meta.client) {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed.value))
  }
}

// CNPJ formatting
const formatarCnpj = (valor: string): string => {
  let v = valor.replace(/\D/g, '')
  if (v.length > 14) v = v.slice(0, 14)
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5')
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4')
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3')
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,3})/, '$1.$2')
  return v
}

const formatarCnpjExibicao = (cnpj?: string): string => {
  if (!cnpj) return ''
  const limpo = cnpj.replace(/\D/g, '')
  if (limpo.length !== 14) return cnpj
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

const empresaCnpjFormatado = computed({
  get: () => empresaForm.cnpj,
  set: (valor: string) => {
    empresaForm.cnpj = formatarCnpj(valor)
  }
})

// Empresa popover actions
const trocarEmpresa = async (emp: Empresa) => {
  empresaPopoverOpen.value = false
  setEmpresaAtiva(emp)
  toast.add({
    title: 'Empresa alterada',
    description: `Agora você está usando "${emp.nome}"`,
    color: 'green'
  })
  await carregarEmpresaAtiva()
}

const abrirModalNovaEmpresa = () => {
  empresaPopoverOpen.value = false
  empresaEditando.value = false
  empresaEditandoId.value = null
  empresaForm.nome = ''
  empresaForm.cnpj = ''
  empresaForm.logo_url = ''
  empresaLogoPreview.value = ''
  empresaLogoFile.value = null
  showEmpresaModal.value = true
}

const abrirModalEditarEmpresa = (emp: Empresa) => {
  empresaPopoverOpen.value = false
  empresaEditando.value = true
  empresaEditandoId.value = emp.id
  empresaForm.nome = emp.nome
  empresaForm.cnpj = emp.cnpj ? formatarCnpjExibicao(emp.cnpj) : ''
  empresaForm.logo_url = emp.logo_url || ''
  empresaLogoPreview.value = emp.logo_url || ''
  empresaLogoFile.value = null
  showEmpresaModal.value = true
}

// Logo upload
const onLogoSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.add({ title: 'Arquivo muito grande', description: 'Máximo de 2MB.', color: 'red' })
    return
  }
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    toast.add({ title: 'Formato inválido', description: 'Use PNG, JPG ou WebP.', color: 'red' })
    return
  }

  empresaLogoFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { empresaLogoPreview.value = e.target?.result as string }
  reader.readAsDataURL(file)
  input.value = ''
}

const uploadLogoEmpresa = async (empresaId: string): Promise<string | undefined> => {
  if (!empresaLogoFile.value) return undefined
  uploadingLogo.value = true
  try {
    const ext = empresaLogoFile.value.name.split('.').pop() || 'png'
    const fileName = `${empresaId}/logo_${Date.now()}.${ext}`
    const { error: uploadError } = await client.storage
      .from('logos')
      .upload(fileName, empresaLogoFile.value, { cacheControl: '3600', upsert: true })
    if (uploadError) throw uploadError
    const { data: urlData } = client.storage.from('logos').getPublicUrl(fileName)
    return urlData.publicUrl
  } catch (error: any) {
    toast.add({ title: 'Erro no upload', description: error.message || 'Não foi possível enviar a logo', color: 'red' })
    return undefined
  } finally {
    uploadingLogo.value = false
  }
}

const removerLogoEmpresa = () => {
  empresaLogoPreview.value = ''
  empresaLogoFile.value = null
  empresaForm.logo_url = ''
}

// Save (create or update)
const salvarEmpresa = async () => {
  if (!empresaForm.nome.trim()) return
  salvandoEmpresa.value = true

  try {
    const cnpjLimpo = empresaForm.cnpj.replace(/\D/g, '') || undefined

    if (empresaEditando.value && empresaEditandoId.value) {
      let logoUrl = empresaForm.logo_url
      if (empresaLogoFile.value) {
        const url = await uploadLogoEmpresa(empresaEditandoId.value)
        if (url) logoUrl = url
      }
      await atualizarEmpresa(empresaEditandoId.value, {
        nome: empresaForm.nome.trim(),
        cnpj: cnpjLimpo,
        logo_url: logoUrl || undefined
      } as Partial<Empresa>)
      toast.add({ title: 'Empresa atualizada!', description: 'As alterações foram salvas.', color: 'green' })
    } else {
      const novaEmpresa = await criarEmpresa(empresaForm.nome.trim(), cnpjLimpo)
      if (empresaLogoFile.value && novaEmpresa?.id) {
        const logoUrl = await uploadLogoEmpresa(novaEmpresa.id)
        if (logoUrl) {
          await atualizarEmpresa(novaEmpresa.id, { logo_url: logoUrl } as Partial<Empresa>)
        }
      }
      toast.add({ title: 'Empresa criada!', description: 'Sua nova empresa foi criada com sucesso.', color: 'green' })
    }

    showEmpresaModal.value = false
    await getEmpresas()
    await carregarEmpresaAtiva()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar empresa', color: 'red' })
  } finally {
    salvandoEmpresa.value = false
  }
}

// Delete empresa
const confirmarDeletarEmpresa = (emp: Empresa) => {
  empresaPopoverOpen.value = false
  empresaParaDeletar.value = emp
  showConfirmDeleteEmpresa.value = true
}

const executarDeletarEmpresa = async () => {
  if (!empresaParaDeletar.value) return
  deletandoEmpresa.value = true
  try {
    await deletarEmpresa(empresaParaDeletar.value.id)
    showConfirmDeleteEmpresa.value = false
    empresaParaDeletar.value = null
    toast.add({ title: 'Empresa excluída', description: 'A empresa foi removida.', color: 'green' })
    await getEmpresas()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir empresa', color: 'red' })
  } finally {
    deletandoEmpresa.value = false
  }
}

const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}

const formatarNome = (nome: string) => {
  return nome
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ')
}

const nomeCompletoUsuario = computed(() => {
  const metadata = user.value?.user_metadata
  const nomeCompleto = metadata?.nome || metadata?.name || metadata?.full_name
  if (nomeCompleto) {
    return formatarNome(nomeCompleto)
  }
  const emailNome = user.value?.email?.split('@')[0] || 'Usuário'
  return formatarNome(emailNome)
})

const iniciaisUsuario = computed(() => {
  const metadata = user.value?.user_metadata
  const nomeCompleto = metadata?.nome || metadata?.name || metadata?.full_name
  if (nomeCompleto) {
    const partes = nomeCompleto.trim().split(/\s+/)
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase()
    }
    return partes[0][0].toUpperCase()
  }
  const emailNome = user.value?.email?.split('@')[0] || 'U'
  return emailNome[0].toUpperCase()
})

watch(() => route.path, () => {
  sidebarOpen.value = false
})

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') {
      sidebarCollapsed.value = true
    }
  }
  carregarEmpresaAtiva()
})
</script>
