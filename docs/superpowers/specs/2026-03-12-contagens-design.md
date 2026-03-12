# Contagens - Design Spec

**Data**: 2026-03-12
**Status**: Aprovado
**Prioridade**: Alta

## Resumo

Implementar sistema completo de contagens de estoque com:
1. Separacao entre estoque principal e apoio (via tipo do setor)
2. Pagina publica mobile-first para o responsavel contar (sem login, via link com token)
3. Pagina admin para visualizar historico de contagens e registrar ajustes
4. Fix do cron job pg_cron para lembretes WhatsApp

---

## 1. Schema (Banco de Dados)

### 1.1 Campo `tipo` na tabela `setores`

```sql
ALTER TABLE setores ADD COLUMN tipo TEXT NOT NULL DEFAULT 'principal'
  CHECK (tipo IN ('principal', 'apoio'));
```

- Cada setor e marcado como `principal` ou `apoio`
- Na revisao da contagem, o sistema compara automaticamente contra o saldo correto:
  - Setor `principal` → compara contra `v_saldo_estoque.saldo_principal`
  - Setor `apoio` → compara contra `v_saldo_estoque.saldo_apoio`

### 1.2 Campo `token` na tabela `contagens`

```sql
ALTER TABLE contagens ADD COLUMN token UUID DEFAULT gen_random_uuid();
UPDATE contagens SET token = gen_random_uuid() WHERE token IS NULL;
ALTER TABLE contagens ALTER COLUMN token SET NOT NULL;
CREATE UNIQUE INDEX idx_contagens_token ON contagens(token);
```

- Token UUID gerado automaticamente ao criar contagem
- Permanente (nao expira) - o mesmo link funciona enquanto a contagem existir
- Index unico para lookup rapido na rota publica
- Backfill: contagens existentes recebem token via UPDATE explicito (DEFAULT so aplica a novas linhas)

### 1.3 Campo `ajuste_registrado` na tabela `contagem_itens`

```sql
ALTER TABLE contagem_itens ADD COLUMN ajuste_registrado BOOLEAN DEFAULT false;
ALTER TABLE contagem_itens ADD COLUMN saldo_no_momento NUMERIC;
```

- `ajuste_registrado`: marca se o admin ja registrou o ajuste para aquele item
- `saldo_no_momento`: snapshot do saldo do sistema no momento da finalizacao da contagem (evita que a comparacao mude se o admin revisar dias depois)
- Evita duplicacao de ajustes

### 1.4 Campo `contagem_id` na tabela `ajustes`

```sql
ALTER TABLE ajustes ADD COLUMN contagem_id UUID REFERENCES contagens(id) ON DELETE SET NULL;
```

- Rastreabilidade: permite saber quais ajustes vieram de qual contagem
- `ON DELETE SET NULL`: se a contagem for deletada, o ajuste permanece (mas perde o vinculo)

### 1.5 View `v_saldo_estoque`

Sem mudanca. Ja calcula `saldo_principal` e `saldo_apoio` separadamente.

---

## 2. Pagina Publica de Contagem (Mobile)

### Rota: `/contagem/[token].vue`

**Caracteristicas:**
- Pagina publica, sem autenticacao necessaria
- Sem layout do sistema: usa `definePageMeta({ layout: false })` para renderizar sem sidebar/header
- Mobile-first design
- Acessada via link enviado por WhatsApp

### Fluxo

1. Usuario acessa `cmv360app.com.br/contagem/[token]`
2. Server-side middleware busca contagem pelo token (via `service_role`, sem RLS)
3. Se token invalido → pagina "Link invalido"
4. Se contagem finalizada → pagina "Contagem ja finalizada"
5. Se valido → mostra interface de contagem

### Layout

```
┌─────────────────────────┐
│  Logo CMV360            │
│  "Contagem: [nome]"     │
│  Data: 12/03/2026       │
├─────────────────────────┤
│  Setor: [dropdown]  ▼   │
├─────────────────────────┤
│  Buscar produto...      │
├─────────────────────────┤
│  Arroz 5kg         [__] │
│  Feijao 1kg        [__] │
│  Oleo 900ml        [__] │
│  Acucar 1kg        [__] │
│  ...                    │
├─────────────────────────┤
│  Progresso: 60%         │
│  [    Salvar Setor    ] │
└─────────────────────────┘
```

### Comportamento

- Dropdown para trocar entre setores da contagem
- Lista de produtos do setor selecionado (vindos de `setor_produtos`)
- Input numerico ao lado de cada produto
- Campo de busca para filtrar produtos por nome
- Barra de progresso (quantos campos ja preenchidos / total)
- Botao "Salvar Setor" grava via API server-side
- Ao salvar, atualiza progresso do setor em `contagem_setores`
- Ao salvar todos os setores, mostra mensagem de sucesso

### API Routes (Server-side)

**`GET /api/contagem/[token]`**
- Busca contagem, setores, produtos, itens ja contados
- Usa `service_role` (bypassa RLS)
- Retorna: `{ contagem, setores: [{ setor, produtos: [{ produto, quantidade_contada }] }] }`

**`POST /api/contagem/[token]`**
- Body: `{ setor_id, itens: [{ produto_id, quantidade_contada }] }`
- Validacao server-side: verifica que `setor_id` pertence a esta contagem e que cada `produto_id` pertence ao setor
- Upsert em `contagem_itens`
- Atualiza progresso do setor em `contagem_setores`
- Usa `service_role`

---

## 3. Pagina Admin: Historico e Revisao

### Rota: `/movimentos/contagens.vue`

Substitui o fluxo atual em `ajustes.vue` (que sera mantida apenas para ajustes manuais).

### Vista Lista

```
┌──────────────────────────────────────────────────┐
│  Contagens                                        │
├──────────────────────────────────────────────────┤
│  [Buscar...]  [Status ▼]         [+ Nova Contagem]│
├──────────────────────────────────────────────────┤
│  Nome        │ Data       │ Responsavel │ Status  │
│──────────────┼────────────┼─────────────┼─────────│
│  Semanal CD  │ 10/03/2026 │ Joao        │ Finaliz │
│  Mensal Apoio│ 01/03/2026 │ Maria       │ Pendente│
│  Diaria Balc │ 12/03/2026 │ Pedro       │ Aguard  │
├──────────────────────────────────────────────────┤
│  Paginacao: < 1 2 3 >                            │
└──────────────────────────────────────────────────┘
```

**Funcionalidades da lista:**
- Busca por nome
- Filtro por status
- Paginacao
- Botao "+ Nova Contagem" abre modal de criacao
- Acoes por linha: editar, copiar link publico, enviar lembrete, excluir

### Vista Detalhes (Contagem Finalizada)

Ao clicar numa contagem finalizada:

```
┌──────────────────────────────────────────────────┐
│  <- Voltar    Contagem: Semanal CD - 10/03/2026   │
├──────────────────────────────────────────────────┤
│  Resumo:                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │Contados │ │Divergen│ │Sobras  │ │Faltas  │    │
│  │  45     │ │  8     │ │  3     │ │  5     │    │
│  └────────┘ └────────┘ └────────┘ └────────┘    │
├──────────────────────────────────────────────────┤
│  Setor: Deposito (Principal)                      │
│  Produto    │ Sistema │ Contado │ Dif │ Acao     │
│─────────────┼─────────┼─────────┼─────┼──────────│
│  Arroz 5kg  │   50    │   48    │  -2 │ [Ajustar]│
│  Feijao 1kg │   30    │   32    │  +2 │ [Ajustar]│
├──────────────────────────────────────────────────┤
│  Setor: Geladeira (Apoio)                         │
│  Cerveja    │   24    │   22    │  -2 │ [Ajustar]│
├──────────────────────────────────────────────────┤
│  [  Registrar Todos os Ajustes  ]                 │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Coluna "Sistema": usa `saldo_no_momento` (snapshot salvo na finalizacao), garantindo que a comparacao nao mude com o tempo
- Coluna "Dif": `contado - sistema`. Vermelho se negativo, verde se positivo
- Botao "Ajustar" individual: cria registro em `ajustes` (com `contagem_id`) e marca `ajuste_registrado = true`
- Botao "Registrar Todos": cria ajustes em lote via `createAjustesEmLote()` (todos com `contagem_id`)
- Itens ja ajustados mostram badge "Ajustado" em vez de botao
- Status "Ajustado" e derivado no frontend (nao e um valor do banco): calculado quando todos os itens com divergencia tem `ajuste_registrado = true`

### Vista Detalhes (Contagem Em Andamento/Pendente)

- Mostra progresso por setor (barra de progresso)
- Botao para copiar URL publica da contagem
- Botao para enviar lembrete WhatsApp manual

---

## 4. Cron Fix + WhatsApp

### Diagnostico

Executar no SQL Editor do Supabase:
```sql
-- Verificar se o job existe
SELECT * FROM cron.job WHERE jobname = 'lembretes-contagem';

-- Verificar logs de execucao
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'lembretes-contagem')
ORDER BY start_time DESC LIMIT 20;
```

### Nova Migration

Recriar o job pg_cron com configuracao atualizada:
- Remover job antigo
- Recriar com URL e bearer token corretos
- Verificar que `pg_net` esta habilitado

```sql
-- Remover job anterior
DO $$
BEGIN
  PERFORM cron.unschedule('lembretes-contagem');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Recriar
-- IMPORTANTE: o valor do Bearer token DEVE corresponder ao CRON_SECRET configurado no Vercel
SELECT cron.schedule(
  'lembretes-contagem',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := 'https://www.cmv360app.com.br/api/cron/lembretes-contagem',
    headers := '{"Authorization": "Bearer cmv360cron2026"}'::jsonb
  );
  $$
);
```

**Nota**: O token `cmv360cron2026` e hardcoded no SQL porque `pg_cron` nao suporta variaveis de ambiente. Deve ser identico ao `CRON_SECRET` configurado no Vercel.

### Mudanca no Endpoint Cron

Arquivo: `server/api/cron/lembretes-contagem.get.ts`

- Buscar campo `token` junto com os dados da contagem
- Incluir link direto na mensagem WhatsApp:

Mensagem atualizada:
```
Ola [nome]! Lembrete de contagem: [contagem_nome].

Acesse aqui para contar:
https://www.cmv360app.com.br/contagem/[token]
```

---

## 5. Sidebar / Navegacao

### Adicionar item no menu lateral

- **Grupo**: Movimentos
- **Item**: "Contagens" (novo, apos "Ajustes")
- **Rota**: `/movimentos/contagens`
- **Icone**: `i-heroicons-clipboard-document-check`

---

## 6. Componentes a Criar/Modificar

### Novos arquivos:
- `pages/contagem/[token].vue` - pagina publica mobile
- `pages/movimentos/contagens.vue` - pagina admin
- `server/api/contagem/[token].get.ts` - API GET publica
- `server/api/contagem/[token].post.ts` - API POST publica
- `supabase/migrations/024_contagens_token_setor_tipo.sql` - migration

### Arquivos a modificar:
- `composables/useEstoque.ts` - ajustar `createContagem` para incluir token, metodos de ajuste por contagem
- `server/api/cron/lembretes-contagem.get.ts` - incluir token no link WhatsApp
- `layouts/default.vue` - adicionar item "Contagens" no sidebar
- `types/index.ts` - atualizar tipos `Contagem`, `Setor`, `ContagemItem`
- `components/contagem/ContagemEditarModal.vue` - adicionar campo tipo do setor

### Componentes existentes reutilizados:
- `ContagemEditarModal.vue` - modal de criacao/edicao de contagem
- `SetorGerenciarModal.vue` - gerenciar setores e produtos

---

## 7. Decisoes Tecnicas

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Acesso do contador | Token UUID permanente na tabela contagens | Sem login, link fixo, funciona para recorrentes |
| Separacao de estoque | Campo `tipo` nos setores | Automatico, zero atrito para o usuario |
| API da pagina publica | Server routes Nuxt (service_role) | Bypassa RLS de forma segura |
| Pagina admin | Nova rota `/movimentos/contagens` | Nao polui a pagina de ajustes manuais |
| Ajuste individual vs lote | Ambos disponiveis | Admin pode ajustar item a item ou tudo de uma vez |
