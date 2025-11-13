# Nushape – Etapa 2 · O Pacto Compacto (Compressão Huffman)

## Visão geral

Nushape é uma aplicação single-page (SPA) que auxilia o usuário a montar treinos e acompanhar avaliações físicas. Nesta fase da disciplina (“Otimização de Recursos – Espaço é Poder”), o foco foi implementar o **algoritmo de compressão Huffman** para otimizar o armazenamento e a transmissão das informações do usuário.

- **UI** (`index.html` + `style.css`): contém o botão global “Exportar dados” e a seção “Meus Dados” com o botão “Importar dados (.nushape)”.
- **Orquestração** (`js/script.js`): mantém todo o estado do app (exercícios selecionados, perfil, avaliações) e integra a compressão/descompressão.
- **Algoritmo** (`js/huffman.js`): implementação completa do Huffman (árvore, códigos, compress/decompress, métricas).

## Fluxo do módulo Huffman

1. **Usuário** seleciona exercícios, preenche dados pessoais e registra avaliações.
2. Ao clicar em **“Exportar dados”**, `buildExportPayload()` gera um JSON com todo o estado.
3. O JSON é enviado para `Huffman.huffmanCompress()` que:
   - Cria a árvore baseada em frequência (`buildHuffmanTree`).
   - Gera códigos binários (`generateCodes`).
   - Constrói uma bitstring, aplica padding e converte para bytes/Base64.
   - Retorna o pacote comprimido, a árvore serializada e métricas.
4. Um **modal** exibe:
   - Barra de economia visual.
   - Tamanho original vs comprimido.
   - % de economia.
   - Tempo de compressão.
   - Nº de caracteres únicos.
   - Profundidade média dos códigos e altura da árvore.
5. O usuário baixa um arquivo `.nushape` (JSON contendo `compressed`, `padding`, `tree` e metadados).
6. Na seção **“Meus Dados”**, o botão “Importar dados (.nushape)” abre o seletor de arquivos:
   - `handleImportFile()` lê o arquivo, valida estrutura, chama `Huffman.huffmanDecompress()` e restaura exatamente o estado exportado.

## Demonstração / Testes em sala

- Execute `index.html` no navegador.
- Monte qualquer cenário (poucos exercícios, muitos, avaliações etc.) e exporte.
- Observe os números exibidos no modal para discutir economia x volume de dados.
- Use o arquivo gerado para importar em outra sessão/navegador e validar a integridade.

Esse fluxo cumpre o desafio da ementa (“compressão baseada em frequência, demonstrar redução e garantir integridade”).

## Implementação técnica

### `js/huffman.js`

```text
buildFrequencyMap     -> O(n)
buildHuffmanTree      -> O(n log n) (fila de prioridade)
generateCodes         -> O(n)
huffmanCompress       -> O(n) para gerar bitstring + bytes
huffmanDecompress     -> O(n) para reconstruir os símbolos
serializeTree/deserializeTree -> O(n)
computeDepthMetrics   -> O(n) (profundidade média)
```

`n` representa o número de símbolos do JSON serializado.

### `js/script.js`

- `exportData()` → mede tempo (`performance.now()`), chama compressão, atualiza o modal e prepara o download.
- `handleExportDownload()` → cria o `.nushape`.
- `handleImportFile()` → valida o arquivo, executa Huffman inverso e reaplica os dados no estado/localStorage.

## Métricas observadas (exemplos reais)

| Cenário                               | Tamanho original | Tamanho comprimido | Economia | Tempo (ms) | Caracteres únicos | Profundidade média | Altura da árvore |
| ------------------------------------- | ---------------- | ------------------ | -------- | ---------- | ----------------- | ------------------ | ---------------- |
| Perfil + 3 avaliações + 10 exercícios | 3.70 KB          | 2.34 KB            | 36.76 %  | 1.60       | 54                | 5.06               | 11               |
| Dados mínimos (somente exercícios)    | 1.18 KB          | 0.78 KB            | 33.90 %  | 0.87       | 38                | 4.52               | 9                |
| Payload grande (20 avali. + seleções) | 6.03 KB          | 3.08 KB            | 48.92 %  | 2.25       | 67                | 5.38               | 12               |

_Os valores variam conforme a redundância dos dados; quanto mais repetições (ex.: listas longas de exercícios), maior a economia._

## Como validar rapidamente

1. **Exportar** → clique no botão no header (modal abre automaticamente).
2. **Baixar** → arquivo `.nushape` com árvore e conteúdo comprimido.
3. **Importar** → na página “Meus Dados”, escolha o arquivo exportado; os dados retornam ao estado anterior.
4. **Comparar** → repita com volumes diferentes e observe a mudança nas métricas do modal.

---

**Arquivos principais**

- `index.html` – modais, botões, inputs de importação.
- `style.css` – estilos do modal, barra de compressão, toasts.
- `js/huffman.js` – algoritmo Huffman puro.
- `js/script.js` – integração (estado, métricas, modal, import/export).
- `js/exportBtn.js` – feedback visual do botão “Exportar dados”.

---

## Grafos – Módulo 1 (Representações)

### Arquitetura geral
- **`algorithms/graphs/graph-representation.js`**: classe `Graph` com `vertices`, `edges`, flags `directed`/`weighted` e métodos `addVertex`, `addEdge`, `getNeighbors`, `getDegree`, `toAdjacencyMatrix` e `toAdjacencyList`.
- **`js/script.js`**: monta o grafo a partir dos exercícios selecionados (`buildWorkoutGraph`) e injeta a matriz/lista na página *Meus Treinos*.
- **UI**: o card “Representação do Grafo dos Exercícios” mostra, lado a lado, a matriz de adjacência e a lista de adjacências para qualquer conjunto de exercícios escolhidos.

### Modelagem aplicada
- **Vértices** → cada exercício (`id`, `nome`, `músculo`, `equipamento`).
- **Arestas** → transições entre exercícios, com peso calculado por custo de troca (equipamento + músculo) e dependências de recuperação (ex.: `Costas → Bíceps`).
- **Direção** → usada para representar quem deve vir antes (respeitando descanso).

### Representações
1. **Matriz de adjacência**: `matrix[i][j] = peso` (0 quando não há aresta). Renderizada como tabela responsiva.
2. **Lista de adjacência**: `{ exercicio: [{ neighbor, weight }] }`, exibida como chips “Nome • Peso”.

Exemplo reduzido (3 exercícios selecionados):
```
Matriz
            Supino  Crucifixo  Rosca
Supino        0        2         6
Crucifixo     2        0         6
Rosca         6        6         0

Lista
Supino → Crucifixo • 2, Rosca Direta • 6
Crucifixo → Supino • 2, Rosca Direta • 6
Rosca Direta → Supino • 6, Crucifixo • 6
```

### Complexidade
- Construção (para `V` vértices): `O(V²)` ao calcular pesos para cada par.
- `toAdjacencyMatrix`: `O(V²)` para preencher a matriz.
- `toAdjacencyList`: `O(V + E)` (E = nº de arestas).

Essas estruturas serão reutilizadas nas próximas etapas (buscas em grafos, Dijkstra, coloração etc.), formando a base para a geração automática de treinos descrita no plano incremental.
