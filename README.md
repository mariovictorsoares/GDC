# Sistema de Controle de Estoque - CD

Sistema completo de controle de estoque para Centro de Distribuição, baseado na planilha "Controle Estoque - CD.xlsm".

## Tecnologias

- **Frontend**: Nuxt 3 (Vue.js)
- **UI**: Nuxt UI (TailwindCSS)
- **Backend/Banco**: Supabase (PostgreSQL)

## Funcionalidades

### Cadastros
- Categorias de produtos
- Unidades de medida
- Destinos de saída
- Produtos (com custos mensais)

### Movimentações
- Entradas (compras) com NF
- Saídas para destinos
- Ajustes de estoque

### Relatórios
- Painel do Mês (visão semanal)
- Curva ABC
- Estoque Mínimo
- Giro de Estoque
- CMV
- Variação de Custo

### Configurações
- Dados da empresa
- Faturamentos mensais

## Configuração

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Anote a URL e a chave anônima (anon key)

### 2. Executar a migração

1. No Supabase, vá em SQL Editor
2. Cole e execute o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`

### 3. Configurar variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env`
2. Preencha com suas credenciais:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-anon-key
```

### 4. Instalar dependências

```bash
npm install
```

### 5. Executar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Estrutura do Projeto

```
estoque-cd/
├── pages/              # Páginas da aplicação
│   ├── cadastro/       # Cadastros (produtos, categorias, etc)
│   ├── movimentos/     # Entradas, saídas, ajustes
│   ├── relatorios/     # Relatórios
│   └── configuracoes/  # Configurações
├── composables/        # Lógica reutilizável
│   ├── useEstoque.ts   # CRUD de todas entidades
│   └── useRelatorios.ts# Lógica dos relatórios
├── layouts/            # Layout da aplicação
├── types/              # Tipos TypeScript
└── supabase/
    └── migrations/     # Scripts SQL
```

## Uso

### Fluxo inicial recomendado

1. Cadastre as **categorias** de produtos
2. Configure as **unidades** de medida
3. Defina os **destinos** de saída
4. Cadastre os **produtos**
5. Registre as **entradas** (compras)
6. Registre as **saídas**
7. Consulte os **relatórios**

### Relatórios

- **Painel Mês**: Visão completa das movimentações por semana
- **Curva ABC**: Classificação dos produtos por valor
- **Estoque Mínimo**: Alertas de reposição
- **Giro de Estoque**: Velocidade de rotação
- **CMV**: Custo da mercadoria vendida vs faturamento
- **Variação de Custo**: Evolução dos preços

## Licença

Uso interno - Baseado na planilha Controle Estoque - CD.xlsm
