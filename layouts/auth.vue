<template>
  <div class="min-h-screen flex relative overflow-hidden">
    <!-- Background com imagem e overlay -->
    <div class="absolute inset-0 z-0">
      <!-- Gradiente de fundo como fallback -->
      <div class="absolute inset-0 bg-gradient-to-br from-guardian-900 via-guardian-800 to-guardian-900" />

      <!-- Imagem de fundo com overlay -->
      <div
        class="absolute inset-0 opacity-20"
        style="background-image: url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=2000&q=80'); background-size: cover; background-position: center;"
      />

      <!-- Overlay gradiente escuro -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
    </div>

    <!-- Lado Esquerdo: Área Visual com ilustração e frase de impacto -->
    <div class="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
      <div class="max-w-lg animate-fade-in">
        <!-- Ícones decorativos flutuantes -->
        <div class="absolute top-20 left-20 animate-float-slow">
          <div class="w-16 h-16 rounded-2xl bg-alerta-500/20 backdrop-blur-sm flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-alerta-400" />
          </div>
        </div>
        <div class="absolute bottom-32 left-32 animate-float-medium">
          <div class="w-14 h-14 rounded-xl bg-controle-500/20 backdrop-blur-sm flex items-center justify-center">
            <UIcon name="i-heroicons-cube" class="w-7 h-7 text-controle-400" />
          </div>
        </div>
        <div class="absolute top-40 right-20 animate-float-fast">
          <div class="w-12 h-12 rounded-lg bg-guardian-500/20 backdrop-blur-sm flex items-center justify-center">
            <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-guardian-400" />
          </div>
        </div>

        <!-- Conteúdo principal -->
        <div class="text-center relative">
          <!-- Badge de destaque -->
          <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
            <div class="w-2 h-2 rounded-full bg-controle-400 animate-pulse" />
            <span class="text-sm text-white/90 font-medium">Sistema de Gestão Profissional</span>
          </div>

          <!-- Headline principal -->
          <h1 class="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Controle total do seu
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-alerta-400 to-alerta-300">
              estoque e CMV
            </span>
          </h1>

          <p class="text-lg text-white/70 mb-10 leading-relaxed">
            Transforme a gestão do seu restaurante com análises inteligentes,
            relatórios detalhados e alertas automáticos.
          </p>

          <!-- Features com animação -->
          <div class="space-y-4">
            <div class="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-alerta-500 to-alerta-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-alerta-500/25 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-chart-pie" class="w-6 h-6 text-white" />
              </div>
              <div class="text-left">
                <h3 class="text-white font-semibold">Análise de CMV em tempo real</h3>
                <p class="text-white/60 text-sm">Monitore custos e margens instantaneamente</p>
              </div>
            </div>

            <div class="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-controle-500 to-controle-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-controle-500/25 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-bell-alert" class="w-6 h-6 text-white" />
              </div>
              <div class="text-left">
                <h3 class="text-white font-semibold">Alertas de estoque mínimo</h3>
                <p class="text-white/60 text-sm">Nunca fique sem produtos essenciais</p>
              </div>
            </div>

            <div class="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-guardian-500 to-guardian-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-guardian-500/25 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-white" />
              </div>
              <div class="text-left">
                <h3 class="text-white font-semibold">Curva ABC automatizada</h3>
                <p class="text-white/60 text-sm">Identifique seus produtos mais importantes</p>
              </div>
            </div>
          </div>

          <!-- Depoimento/Trust -->
          <div class="mt-10 pt-8 border-t border-white/10">
            <div class="flex items-center justify-center gap-1 mb-3">
              <UIcon name="i-heroicons-star-solid" class="w-5 h-5 text-alerta-400" />
              <UIcon name="i-heroicons-star-solid" class="w-5 h-5 text-alerta-400" />
              <UIcon name="i-heroicons-star-solid" class="w-5 h-5 text-alerta-400" />
              <UIcon name="i-heroicons-star-solid" class="w-5 h-5 text-alerta-400" />
              <UIcon name="i-heroicons-star-solid" class="w-5 h-5 text-alerta-400" />
            </div>
            <p class="text-white/50 text-sm">Confiado por centenas de restaurantes em todo o Brasil</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lado Direito: Formulário em card -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
      <div class="w-full max-w-md animate-slide-up">
        <!-- Card do formulário -->
        <div class="bg-white rounded-2xl shadow-2xl shadow-black/20 p-8 sm:p-10 border border-gray-100">
          <slot />
        </div>

        <!-- Footer do card -->
        <p class="text-center text-white/40 text-xs mt-6">
          © {{ new Date().getFullYear() }} Guardião do CMV. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
/* Animação de fade-in */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

/* Animação de slide-up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}

/* Animações de flutuação para ícones decorativos */
@keyframes floatSlow {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

@keyframes floatMedium {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(-5deg);
  }
}

@keyframes floatFast {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-float-slow {
  animation: floatSlow 6s ease-in-out infinite;
}

.animate-float-medium {
  animation: floatMedium 4s ease-in-out infinite;
}

.animate-float-fast {
  animation: floatFast 3s ease-in-out infinite;
}

/* Animação de shake para erros */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
