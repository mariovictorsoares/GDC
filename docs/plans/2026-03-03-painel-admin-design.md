# Painel Admin — Design

## Objetivo

Pagina unica de gerenciamento do sistema para o super-admin (Alessandro). Consolida assinaturas, usuarios e cobrancas numa tabela unificada. Permite conceder/revogar acesso gratis.

## Decisoes

- **Layout**: dentro do sistema, com sidebar padrao. Item visivel so para super-admin.
- **Rota**: `/admin` (substitui `/admin/assinaturas` existente)
- **Acesso gratis**: novo status `'free'` na assinatura. Middleware e composable tratam como `'active'`.
- **Estrutura**: tabela unificada com linha expansivel para detalhes.

## Tabela principal

Colunas:

| Empresa | Usuario (email) | Plano | Status | Trial ate | Ultima cobranca | Acoes |

- **Status**: badge colorido — trial (azul), active (verde), free (guardian), blocked (vermelho), cancelled (cinza), past_due (amber)
- **Acoes**: dropdown contextual

## Acoes no dropdown

- Conceder acesso gratis → status = `'free'`
- Revogar acesso gratis → status = `'blocked'`
- Estender trial → modal com input de dias
- Alterar status → modal com select
- Abrir no Stripe → link externo (se tiver stripe_customer_id)

## Linha expandida

- CNPJ, data criacao, stripe_customer_id
- Observacao admin (editavel inline)
- Historico de cobrancas Stripe (invoices.list por customer)

## Mudancas no schema/tipos

1. `types/index.ts`: adicionar `'free'` ao union type de `Assinatura['status']`
2. `middleware/auth.global.ts`: tratar `'free'` como `'active'`
3. `composables/useAssinatura.ts`: `computeSubscriptionState` retorna `{ state: 'active' }` para `'free'`

## API endpoints

- `GET /api/admin/empresas` — lista empresas com join assinaturas + usuarios_empresas + auth.users(email). Super-admin only.
- `PATCH /api/admin/assinaturas` — expandir para acoes `conceder_free` e `revogar_free`
- `GET /api/admin/stripe/invoices?customer_id=X` — busca invoices de um customer no Stripe

## Sidebar

- Novo item "Painel Admin" com icone `i-heroicons-cog-6-tooth`
- Visivel apenas quando `isSuperAdmin === true`
- Posicao: ultimo item antes de Configuracoes

## Pagina antiga

- `/pages/admin/assinaturas.vue` sera substituida por `/pages/admin/index.vue` (ou removida)
