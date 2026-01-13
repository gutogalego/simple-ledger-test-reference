# Vamos Construir um Livro-Razão

## Contexto

Um livro-razão é um dos blocos fundamentais das aplicações financeiras.
Ele sustenta sistemas de contabilidade, blockchains e qualquer coisa que acompanhe a movimentação de dinheiro.

Vamos construir um livro-razão de contabilidade de partidas dobradas.
Nesse sistema, cada transação é registrada como um conjunto de lançamentos, um ou mais débitos e um ou mais créditos, cujo valor total sempre se equilibra em zero.
Debitar (retirar) fundos de uma conta exige creditar (depositar) o mesmo valor em outra.
Essa estrutura facilita a detecção de erros comuns de contabilidade; se a soma de todos os débitos e créditos em todas as transações não for zero, ocorreu um erro.

Uma transação básica que representa a retirada de US$ 100,00 de uma conta de “Fundos Discricionários” em dinheiro para ser colocada na carteira do proprietário pode ser representada em um sistema de partidas dobradas da seguinte forma:

| Fundos Discricionários | Dinheiro     |
| ---------------------- | ------------ |
| - 100.00               | + US$ 100.00 |

Nosso sistema de livro-razão também inclui a noção de direção das contas — algumas contas representam principalmente passivos ou a movimentação de fundos para fora da nossa propriedade, enquanto outras acompanham ativos ou fundos que entram. Isso significa que precisaremos prestar muita atenção à direção relativa de cada lançamento: um lançamento que representa a remoção de fundos do nosso sistema geralmente é um débito, mas quando aplicado a uma conta de débito ele deve ser expresso como um crédito!

### Contas

Uma **conta** representa o que uma conta tradicional representaria em um sistema contábil de partidas dobradas. Ela pode ser usada para representar um ativo, passivo, despesa ou qualquer outra coisa que desejarmos. Algumas propriedades importantes das contas:

- As contas têm uma direção, que pode ser “debit” (débito) ou “credit” (crédito).
- Os saldos das contas nunca podem ser modificados diretamente; eles só podem ser alterados por meio da criação de transações.

### Transações

Uma **transação** representa uma ação que modifica os saldos das contas. Ela pode ser usada para representar uma compra, o pagamento de uma conta, o pagamento de juros, a transferência de dinheiro entre contas, etc. As transações possuem uma lista de lançamentos, cada um representando modificações no saldo de uma conta.

Algumas propriedades importantes das transações:

- Os lançamentos precisam se equilibrar. Isso significa que a soma de todos os débitos deve ser igual à soma de todos os créditos.

### Lançamentos (Entries)

Um **lançamento** indica uma mudança no saldo de uma conta.

Aqui está o esquema de um lançamento:

| Campo     | Descrição                                            |
| --------- | ---------------------------------------------------- |
| id        | Se não for fornecido, é gerado na criação do objeto. |
| direction | Obrigatório. Deve ser “debit” ou “credit”.           |
| amount    | Representa o valor do lançamento em USD.             |

## Regras

Quando os usuários interagem com o livro-razão, precisamos preservar algumas regras.

### Aplicando uma Transação

Quando uma transação é aplicada ao livro-razão, todas as contas afetadas devem ser atualizadas com os valores correspondentes dos lançamentos.

### Aplicando um Lançamento no Livro-Razão

Quando um lançamento é aplicado a uma conta, o saldo é atualizado com base na relação entre a direção da conta e a direção do lançamento:

- Se as direções forem iguais, o saldo é aumentado pelo valor do lançamento (somado).
- Se as direções forem diferentes, o saldo é diminuído pelo valor do lançamento (subtraído).

#### Exemplo

Aqui estão alguns exemplos de lançamentos e seu impacto nas contas às quais são aplicados:

| Saldo Inicial da Conta | Direção da Conta | Direção do Lançamento | Valor do Lançamento | Saldo Final da Conta |
| ---------------------- | ---------------- | --------------------- | ------------------- | -------------------- |
| 0                      | debit            | debit                 | 100                 | 100                  |
| 0                      | credit           | credit                | 100                 | 100                  |
| 100                    | debit            | credit                | 100                 | 0                    |
| 100                    | credit           | debit                 | 100                 | 0                    |

## Guia da API

Os usuários precisarão interagir com o livro-razão para ver seus saldos e criar transações. Eles farão isso usando a API HTTP/JSON definida aqui.

### POST /accounts

| Campo     | Descrição                                            |
| --------- | ---------------------------------------------------- |
| id        | Se não for fornecido, é gerado na criação do objeto. |
| name      | Rótulo opcional para a conta.                        |
| balance   | Representa o saldo inicial da conta em USD.          |
| direction | Obrigatório. Deve ser “debit” ou “credit”.           |

**Exemplo de Requisição:**

```bash
curl --request POST \
     --url https://localhost:5000/accounts \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --data '
{
  "name": "test3",
  "direction": "debit",
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd"
}
'
```

**Exemplo de Resposta:**

```json
{
  "balance": 0,
  "direction": "debit",
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "test3"
}
```

### GET /accounts/:id

```bash
curl --location --request GET 'localhost:5000/accounts/fa967ec9-5be2-4c26-a874-7eeeabfc6da8'
```

**Exemplo de Resposta:**

```json
{
  "balance": 0,
  "direction": "debit",
  "id": "71cde2aa-b9bc-496a-a6f1-34964d05e6fd",
  "name": "test3"
}
```

### POST /transactions

| Campo   | Descrição                                            |
| ------- | ---------------------------------------------------- |
| id      | Se não for fornecido, é gerado na criação do objeto. |
| name    | Rótulo opcional para a transação.                    |
| entries | um array de objetos de lançamentos do livro-razão    |

**Exemplo de Requisição:**

```bash
curl --location --request POST 'localhost:5000/transactions' \
     --header 'Content-Type: application/json' \
     --data-raw '
{
  "name": "test",
  "id": "3256dc3c-7b18-4a21-95c6-146747cf2971",
  "entries": [
    {
      "direction": "debit",
      "account_id": "fa967ec9-5be2-4c26-a874-7eeeabfc6da8",
      "amount": 100
    },
    {
      "direction": "credit",
      "account_id": "dbf17d00-8701-4c4e-9fc5-6ae33c324309",
      "amount": 100
    }
  ]
}'
```

**Exemplo de Resposta:**

```json
{
  "id": "3256dc3c-7b18-4a21-95c6-146747cf2971",
  "name": "test",
  "entries": [
    {
      "account_id": "fa967ec9-5be2-4c26-a874-7eeeabfc6da8",
      "amount": 100,
      "direction": "debit",
      "id": "9f694f8c-9c4c-44cf-9ca9-0cb1a318f0a7"
    },
    {
      "account_id": "dbf17d00-8701-4c4e-9fc5-6ae33c324309",
      "amount": 100,
      "direction": "credit",
      "id": "a5c1b7f0-e52e-4ab6-8f31-c380c2223efa"
    }
  ]
}
```

## Requisitos

- Implementar os endpoints da API descritos acima usando TypeScript e Node.js.
- Usar armazenamento em memória para contas, transações e lançamentos (nenhuma configuração de banco de dados é necessária).
- Garantir que toda a lógica de negócio esteja correta, especialmente as regras de balanceamento de partidas dobradas e a atualização dos saldos das contas.
- Fornecer um README.md com instruções de configuração, dependências e como executar o projeto.
- Criar um repositório no GitHub para a submissão e compartilhar o link conosco.

## O Que Vamos Avaliar

Vamos revisar sua submissão com foco em:

- Arquitetura e organização do código: o design é claro, modular e fácil de estender?
- Correção da lógica de negócio: as transações estão balanceadas? As contas são atualizadas corretamente?
- Clareza e legibilidade: o código e a API são fáceis de entender?
- Profundidade técnica: a implementação demonstra forte capacidade de engenharia, abstrações bem pensadas, interfaces limpas e decisões de design sólidas?

Mantenha sua solução focada e autocontida, mas não deixe de demonstrar cuidado artesanal ou iniciativa sempre que isso melhorar o design.
