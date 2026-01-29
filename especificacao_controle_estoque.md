# 📋 ESPECIFICAÇÃO COMPLETA - SISTEMA DE CONTROLE DE ESTOQUE CD

## CONTEXTO
Este documento contém a especificação 100% completa de uma planilha Excel de controle de estoque para Centro de Distribuição (CD) do setor de food service/restaurante. Use este documento para validar se o sistema desenvolvido está em conformidade com TODAS as regras de negócio, cálculos e funcionalidades.

---

# 1️⃣ ESTRUTURA DE DADOS (ENTIDADES)

## 1.1 CADASTRO DE PRODUTOS
**Tabela principal de produtos**

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| CATEGORIA | String | Categoria do produto (ex: MTP, PROTEINA, HORTIFRUTI, EMBALAGEM, etc.) | Sim |
| PRODUTO | String | Nome do produto (ex: COXÃO MOLE, FILE MIGNON) | Sim |
| UNIDADE | String | Unidade de medida (KG, UN, L, etc.) | Sim |
| EST_INICIAL | Decimal | Quantidade em estoque inicial | Sim |
| CUSTO_INICIAL | Decimal (R$) | Custo unitário inicial | Não |
| CUSTO_MES_1 a CUSTO_MES_12 | Decimal (R$) | Custo médio por mês (calculado automaticamente) | Automático |

**Regra de Custo Mensal:**
```
CUSTO_MES[n] = SOMA(Valor Total Entradas do Mês) / SOMA(Quantidade Entradas do Mês)
```
Fórmula Excel:
```
=IFERROR(SUMIFS(ENTRADAS!$J:$J,ENTRADAS!$B:$B,PRODUTO,ENTRADAS!$I:$I,MES) / SUMIFS(ENTRADAS!$D:$D,ENTRADAS!$B:$B,PRODUTO,ENTRADAS!$I:$I,MES), 0)
```

---

## 1.2 ENTRADAS (COMPRAS/RECEBIMENTOS)
**Registro de todas as entradas de mercadorias**

| Campo | Tipo | Descrição | Origem |
|-------|------|-----------|--------|
| CATEGORIA | String | Categoria do produto | Input usuário |
| PRODUTO | String | Nome do produto | Input usuário |
| UNIDADE | String | Unidade de medida | VLOOKUP do Cadastro |
| QUANTIDADE | Decimal | Quantidade recebida | Input usuário |
| DATA | Date | Data do recebimento | Input usuário |
| SEMANA | String | Semana do mês (SEMANA 1 a 6) | Calculado |
| CUSTO_UNITARIO | Decimal | Custo por unidade | Calculado |
| MES_REF | Date | Primeiro dia do mês | Calculado |
| VALOR_TOTAL | Decimal | Valor total da entrada | Input usuário |
| NUM_NF | String | Número da Nota Fiscal | Input usuário |

**Cálculos automáticos:**
```
UNIDADE = VLOOKUP(PRODUTO, CADASTRO!B:C, 2, 0)
SEMANA = "SEMANA " + (WEEKNUM(DATA) - WEEKNUM(EOMONTH(DATA,-1)+1) + 1)
CUSTO_UNITARIO = VALOR_TOTAL / QUANTIDADE
MES_REF = DATE(YEAR(DATA), MONTH(DATA), 1)
```

---

## 1.3 SAÍDAS (CONSUMO/EXPEDIÇÃO)
**Registro de todas as saídas de estoque**

| Campo | Tipo | Descrição | Origem |
|-------|------|-----------|--------|
| CATEGORIA | String | Categoria do produto | Input usuário |
| PRODUTO | String | Nome do produto | Input usuário |
| UNIDADE | String | Unidade de medida | VLOOKUP do Cadastro |
| QUANTIDADE | Decimal | Quantidade que saiu | Input usuário |
| DATA | Date | Data da saída | Input usuário |
| SEMANA | String | Semana do mês | Calculado |
| MES_REF | Date | Primeiro dia do mês | Calculado |
| CUSTO_SAIDA | Decimal | Custo da saída (valorizado) | Calculado |
| DESTINO | String | Para onde foi (FABRICA, COZINHA, etc.) | Input usuário |

**Cálculo do CUSTO_SAIDA (REGRA CRÍTICA):**
```
SE o custo do mês atual for 0:
    CUSTO_SAIDA = Custo Inicial do Cadastro * Quantidade
SENÃO:
    CUSTO_SAIDA = Custo do Mês Atual * Quantidade
```
Fórmula Excel:
```
=IFERROR(
    IF(INDEX(CADASTRO, MATCH(PRODUTO, CADASTRO!B:B, 0), MATCH(MES_REF, CADASTRO!2:2, 0)) = 0,
       VLOOKUP(PRODUTO, CADASTRO!B:E, 4, 0),
       INDEX(CADASTRO, MATCH(PRODUTO, CADASTRO!B:B, 0), MATCH(MES_REF, CADASTRO!2:2, 0))
    ), 0) * QUANTIDADE
```

---

## 1.4 AJUSTES DE ESTOQUE
**Correções de inventário (quebras, perdas, diferenças de contagem)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CATEGORIA | String | Categoria do produto |
| PRODUTO | String | Nome do produto |
| UNIDADE | String | Unidade de medida |
| QUANTIDADE | Decimal | **Diferença** (positivo = sobra, negativo = falta) |
| DATA | Date | Data do ajuste |
| SEMANA | String | Semana do mês |
| MES_REF | Date | Primeiro dia do mês |

**Regra especial de cálculo do ajuste:**
```
QUANTIDADE_AJUSTE = Quantidade_Contagem_Fisica - Quantidade_Sistema
```
O formulário VBA faz:
```vba
resultadoSoma = qtdDigitada - qtdEstoqueMinimo
```

**Proteção:** Acesso à aba de ajustes requer senha (padrão: "1234")

---

# 2️⃣ REGRAS DE NEGÓCIO - CÁLCULOS

## 2.1 CÁLCULO DE ESTOQUE FINAL
```
ESTOQUE_FINAL = ESTOQUE_INICIAL + ENTRADAS - SAÍDAS + AJUSTES
```
Fórmula por produto/mês:
```
=ESTOQUE_INICIAL 
 + SUMIFS(ENTRADAS!D:D, ENTRADAS!B:B, PRODUTO, ENTRADAS!I:I, MES_REF)
 - SUMIFS(SAÍDAS!D:D, SAÍDAS!B:B, PRODUTO, SAÍDAS!H:H, MES_REF)
 + SUMIFS(AJUSTE!D:D, AJUSTE!B:B, PRODUTO, AJUSTE!H:H, MES_REF)
```

## 2.2 CÁLCULO DE SEMANA DO MÊS
```
SEMANA = "SEMANA " + (WEEKNUM(DATA) - WEEKNUM(Primeiro_Dia_Mes) + 1)
```
Pode ter SEMANA 1 até SEMANA 6.

## 2.3 CÁLCULO DO CMV (Custo da Mercadoria Vendida)
```
CMV_MES = SOMA(Custo_Saida de todas as saídas do mês)
```
**Exceção importante:** Produtos da categoria "MTP" são EXCLUÍDOS do CMV:
```
CMV = SUMIFS(SAÍDAS!I:I, SAÍDAS!H:H, MES) - SUMIFS(SAÍDAS!I:I, SAÍDAS!A:A, "mtp", SAÍDAS!H:H, MES)
```

## 2.4 CÁLCULO DE GIRO DE ESTOQUE

### Giro em Dias (Real)
```
GIRO_DIAS_REAL = (ESTOQUE_FINAL / CMV) * 30
```
Interpretação: Quantos dias o estoque dura baseado no consumo atual.

### Vezes por Mês (Real)
```
VEZES_MES_REAL = 30 / GIRO_DIAS_REAL
```
Interpretação: Quantas vezes o estoque "gira" no mês.

### Giro em Dias (Médio)
```
ESTOQUE_MEDIO = (ESTOQUE_INICIAL + ESTOQUE_FINAL) / 2
GIRO_DIAS_MEDIO = (ESTOQUE_MEDIO / CMV) * 30
```

### Vezes por Mês (Médio)
```
VEZES_MES_MEDIO = 30 / GIRO_DIAS_MEDIO
```

**Exceção para categoria MTP:**
```
SE CATEGORIA = "MTP":
    GIRO_DIAS = (VALOR_ESTOQUE / (QTD_SAIDAS * CUSTO_UNITARIO)) * 30
SENÃO:
    GIRO_DIAS = (VALOR_ESTOQUE / CMV) * 30
```

---

# 3️⃣ CURVA ABC

## 3.1 Parâmetros de Classificação
| Classe | % Acumulado Estoque | % Acumulado CMV |
|--------|---------------------|-----------------|
| A | 0% a 80% | 0% a 80% |
| B | 80% a 95% | 80% a 95% |
| C | 95% a 100% | 95% a 100% |

## 3.2 ABC de Estoque
Ordena produtos por VALOR EM ESTOQUE (decrescente) e classifica pelo Pareto acumulado.

**Cálculo do Pareto:**
```
PARETO = SOMA_ACUMULADA(VALOR_ESTOQUE) / TOTAL_ESTOQUE
```

**Classificação:**
```
SE PARETO <= 0.80 ENTÃO "A"
SENÃO SE PARETO <= 0.95 ENTÃO "B"
SENÃO "C"
```

## 3.3 ABC de CMV
Ordena produtos por VALOR CMV (decrescente) e classifica pelo Pareto acumulado.

## 3.4 Comparativo ABC
Cruza ABC Estoque vs ABC CMV para identificar:
- Produtos Classe A em estoque mas C em CMV = **Estoque excessivo**
- Produtos Classe C em estoque mas A em CMV = **Risco de ruptura**

---

# 4️⃣ ESTOQUE MÍNIMO E PONTO DE PEDIDO

## 4.1 Campos e Cálculos

| Campo | Fórmula |
|-------|---------|
| CONSUMO_MEDIO_SEMANAL | SOMA(Saídas últimos meses) / (Qtd semanas * 4.34) |
| CONSUMO_MEDIO_DIARIO | CONSUMO_MEDIO_SEMANAL / 7 |
| ESTOQUE_MINIMO | CONSUMO_MEDIO_DIARIO * TEMPO_REPOSICAO |
| ESTOQUE_MINIMO_COM_MARGEM | ESTOQUE_MINIMO + (ESTOQUE_MINIMO * MARGEM_SEGURANCA) |
| REPOR_ESTOQUE | SE(ESTOQUE_ATUAL <= ESTOQUE_MINIMO_COM_MARGEM, "SIM", "NÃO") |
| DATA_PONTO_PEDIDO | HOJE() + DIAS_ATE_RUPTURA |
| DIAS_ATE_RUPTURA | (ESTOQUE_ATUAL / CONSUMO_MEDIO_DIARIO) - TEMPO_REPOSICAO |
| DENTRO_DO_PRAZO | SE(DATA_PONTO_PEDIDO < HOJE(), "ATRASADO", "EM TEMPO") |
| SUGESTAO_PEDIDO | SE(REPOR="SIM", (ESTOQUE_MINIMO - ESTOQUE_ATUAL) + ESTOQUE_MINIMO, 0) |

## 4.2 Campos de Input
- **MARGEM_SEGURANCA**: Percentual (ex: 10%, 20%)
- **TEMPO_REPOSICAO**: Dias (lead time do fornecedor)

---

# 5️⃣ VARIAÇÃO DE CUSTO

## 5.1 Cálculo da Variação
```
VARIACAO_PERCENTUAL = ((CUSTO_MES_ATUAL / CUSTO_MES_ANTERIOR) - 1) * 100
```

Exibido mês a mês para identificar aumentos de fornecedores.

---

# 6️⃣ PAINEL MENSAL (DASHBOARD)

## 6.1 Estrutura
Visão consolidada por produto no mês selecionado:

| Coluna | Descrição |
|--------|-----------|
| Categoria | Categoria do produto |
| Produto | Nome do produto |
| Estoque Inicial | Quantidade no início do mês |
| Unidade | Unidade de medida |
| Saídas Semana 1-5 | Quantidade que saiu por semana |
| Total Saídas | Soma das saídas |
| Entradas Semana 1-5 | Quantidade que entrou por semana |
| Total Entradas | Soma das entradas |
| Estoque Final | Quantidade no fim do mês |
| Custo Unitário | Custo médio do mês |
| Valor Estoque | Estoque Final * Custo Unitário |
| CMV | Saídas * Custo Unitário (exceto MTP) |
| Giro Dias | Giro de estoque em dias |
| Vezes/Mês | Quantas vezes gira no mês |

## 6.2 Seleção de Mês
O mês de referência é selecionado na aba MENU e usado como filtro em todas as análises.

---

# 7️⃣ FUNCIONALIDADES DO SISTEMA (FORMULÁRIOS)

## 7.1 Formulário de Cadastro de Produtos
**Campos:**
- Categoria (dropdown)
- Nome do Produto (texto)
- Unidade de Medida (dropdown: KG, UN, L, etc.)
- Estoque Inicial (número)
- Custo Inicial (moeda)

**Ação:** Insere nova linha na tabela de Cadastro

## 7.2 Formulário de Lançar Entradas
**Campos:**
- Categoria (dropdown)
- Produto (dropdown filtrado pela categoria)
- Quantidade (número decimal)
- Data (formato dd/mm/yyyy com máscara)
- Valor Total (moeda)
- Número NF (texto)

**Regra de filtro de produtos:**
```
Ao selecionar uma Categoria, o dropdown de Produtos 
mostra apenas os produtos daquela categoria.
```

**Ação:** Insere nova linha na tabela de Entradas

## 7.3 Formulário de Lançar Saídas
**Campos:**
- Categoria (dropdown)
- Produto (dropdown filtrado pela categoria)
- Quantidade (número decimal)
- Data (formato dd/mm/yyyy com máscara)
- Destino (dropdown: FABRICA, COZINHA, etc.)

**Ação:** Insere nova linha na tabela de Saídas

## 7.4 Formulário de Ajustes
**Proteção:** Requer senha para acessar (padrão: "1234")

**Campos:**
- Categoria (dropdown)
- Produto (dropdown filtrado pela categoria)
- Quantidade Física Contada (número)
- Data (formato dd/mm/yyyy)

**Cálculo automático:**
```
Ajuste = Quantidade_Contada - Quantidade_Sistema
```
Se positivo = sobra, se negativo = falta.

**Comportamento especial:**
- Após salvar, pergunta se deseja continuar
- Se não, oculta a aba de ajustes

---

# 8️⃣ RELATÓRIOS E ANÁLISES

## 8.1 Análise ABC
- Relatório de classificação ABC de Estoque
- Relatório de classificação ABC de CMV
- Comparativo ABC Estoque vs CMV

## 8.2 Giro de Estoque
- Giro mensal (Janeiro a Dezembro)
- Estoque Real vs Estoque Médio
- CMV mensal
- Giro em dias e vezes/mês

## 8.3 Estoque Mínimo
- Lista de produtos com estoque abaixo do mínimo
- Sugestão de volume a pedir
- Alertas de prazo (ATRASADO / EM TEMPO)

## 8.4 Variação de Custo
- Comparativo de custo mês a mês
- Variação percentual

## 8.5 Folha de Contagem (Impressão)
- Lista de produtos para contagem física
- Colunas para anotação por dia da semana (DOM a SÁB)

---

# 9️⃣ CATEGORIAS DE PRODUTOS (LISTA)
As categorias usadas na planilha incluem:
- ALCOÓLICAS
- BEBIDAS_SEM_ÁLCOOL
- CONGELADOS
- DOCES
- EMBALAGEM
- HORTIFRUTI
- MERCEARIA
- PROTEÍNAS / PROTEINA
- PORÇÕES
- DESTILADOS
- BALCÃO
- PRODUÇÃO
- MTP (Matéria Prima de Transferência - tratamento especial no CMV)
- PORCIONADOS
- RESERVA6 a RESERVA13

---

# 🔟 FLUXO DE DADOS

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CADASTRO   │────▶│  ENTRADAS   │────▶│    BASE     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │            ┌──────┴──────┐            │
       │            ▼             ▼            ▼
       │     ┌─────────────┐ ┌─────────┐ ┌──────────────┐
       └────▶│   SAÍDAS    │ │ AJUSTE  │ │ PAINEL MÊS   │
             └─────────────┘ └─────────┘ └──────────────┘
                    │             │             │
                    └──────┬──────┘             │
                           ▼                    ▼
                    ┌─────────────┐      ┌─────────────┐
                    │  CURVA ABC  │◀─────│GIRO ESTOQUE │
                    └─────────────┘      └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             ┌─────────────┐ ┌─────────────┐
             │ COMPARATIVO │ │EST. MÍNIMO  │
             └─────────────┘ └─────────────┘
```

---

# 1️⃣1️⃣ REGRAS DE NEGÓCIO ESPECIAIS

## 11.1 Tratamento da Categoria MTP
- Produtos MTP são **EXCLUÍDOS** do cálculo de CMV
- O giro de estoque de produtos MTP usa fórmula diferente
- CMV para MTP = 0 (não conta como custo de venda)

## 11.2 Cálculo de Semana
- A semana é calculada com base no mês (não no ano)
- Pode haver até 6 semanas em um mês
- SEMANA 5 e SEMANA 6 podem ser combinadas em algumas visualizações

## 11.3 Custo Médio Ponderado
- O custo unitário é calculado como média ponderada das entradas do mês
- Se não houver entrada no mês, usa o custo do mês anterior ou custo inicial

## 11.4 Estoque Negativo
- O sistema permite estoque negativo (indica erro de lançamento)
- Deve ser corrigido via Ajuste de Estoque

## 11.5 Proteção de Dados
- Aba de Ajustes é oculta e protegida por senha
- Senha padrão: "1234"

---

# 1️⃣2️⃣ VALIDAÇÕES NECESSÁRIAS

1. **Produto deve existir no Cadastro** antes de lançar Entrada/Saída
2. **Quantidade deve ser positiva** em Entradas e Saídas
3. **Data deve ser válida** e no formato correto
4. **Categoria deve corresponder ao Produto** (filtro cascata)
5. **Valor Total deve ser maior que zero** em Entradas
6. **Destino é obrigatório** em Saídas

---

# 1️⃣3️⃣ FÓRMULAS PRINCIPAIS (REFERÊNCIA)

## Estoque Final por Produto/Mês
```
=ESTOQUE_INICIAL 
+ SUMIFS(ENTRADAS, PRODUTO, MES) 
- SUMIFS(SAÍDAS, PRODUTO, MES) 
+ SUMIFS(AJUSTES, PRODUTO, MES)
```

## Custo Médio do Mês
```
=IFERROR(
    SUMIFS(ENTRADAS!VALOR_TOTAL, PRODUTO, MES) / 
    SUMIFS(ENTRADAS!QUANTIDADE, PRODUTO, MES)
, CUSTO_ANTERIOR)
```

## CMV
```
=SUMIFS(SAIDAS!CUSTO_SAIDA, MES) 
- SUMIFS(SAIDAS!CUSTO_SAIDA, CATEGORIA="MTP", MES)
```

## Giro em Dias
```
=IFERROR((ESTOQUE_FINAL_VALOR / CMV) * 30, 0)
```

## Classificação ABC
```
=IF(PARETO <= 0.80, "A", IF(PARETO <= 0.95, "B", "C"))
```

## Ponto de Pedido
```
=IF(ESTOQUE_ATUAL <= ESTOQUE_MINIMO_COM_MARGEM, "SIM", "NÃO")
```

---

# 1️⃣4️⃣ CHECKLIST DE VALIDAÇÃO DO SISTEMA

Use este checklist para validar se o sistema está completo:

## Cadastro
- [ ] CRUD de produtos (Criar, Ler, Atualizar, Deletar)
- [ ] Campos: Categoria, Produto, Unidade, Est. Inicial, Custo Inicial
- [ ] Cálculo automático de custo médio mensal

## Entradas
- [ ] Formulário com filtro cascata (Categoria → Produto)
- [ ] Campos: Categoria, Produto, Quantidade, Data, Valor Total, NF
- [ ] Cálculo automático: Unidade, Semana, Custo Unitário, Mês Ref
- [ ] Máscara de data dd/mm/yyyy

## Saídas
- [ ] Formulário com filtro cascata
- [ ] Campos: Categoria, Produto, Quantidade, Data, Destino
- [ ] Cálculo automático: Custo da Saída (valorização)
- [ ] Lista de destinos configurável

## Ajustes
- [ ] Proteção por senha
- [ ] Cálculo: Ajuste = Contagem - Sistema
- [ ] Pergunta se deseja continuar após salvar

## Dashboard/Painel
- [ ] Seleção de mês/ano
- [ ] Estoque inicial, entradas, saídas por semana
- [ ] Estoque final
- [ ] Valor em estoque
- [ ] CMV (excluindo MTP)

## Curva ABC
- [ ] ABC de Estoque (ordenado por valor)
- [ ] ABC de CMV (ordenado por valor CMV)
- [ ] Parâmetros configuráveis (80%/95%)
- [ ] Comparativo ABC Estoque vs CMV

## Estoque Mínimo
- [ ] Cálculo de consumo médio
- [ ] Estoque mínimo + margem de segurança
- [ ] Alerta REPOR ESTOQUE (SIM/NÃO)
- [ ] Data do ponto de pedido
- [ ] Status (ATRASADO/EM TEMPO)
- [ ] Sugestão de volume a pedir

## Giro de Estoque
- [ ] Giro em dias (real e médio)
- [ ] Vezes por mês (real e médio)
- [ ] Visão mensal (12 meses)
- [ ] Estoque médio anual

## Variação de Custo
- [ ] Custo por mês
- [ ] Variação percentual entre meses

## Relatórios
- [ ] Folha de contagem para impressão
- [ ] Análise ABC consolidada
- [ ] Histórico de saídas por produto

---

# FIM DA ESPECIFICAÇÃO
