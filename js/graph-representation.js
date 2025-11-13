/**
 * Graph Representation Module
 * Responsável por modelar o grafo de exercícios selecionados no Nushape.
 * Cada vértice representa um exercício e cada aresta descreve o custo/direção
 * de executar dois exercícios em sequência.
 */
class Graph {
  /**
   * @param {Object} options
   * @param {boolean} [options.directed=true]  Define se as arestas possuem direção
   * @param {boolean} [options.weighted=true]  Define se as arestas possuem peso associado
   */
  constructor({ directed = true, weighted = true } = {}) {
    /** @type {Map<string, any>} Conjunto de vértices (exercícios). */
    this.vertices = new Map();
    /** @type {Array<{ from:string, to:string, weight:number }>} Conjunto de arestas. */
    this.edges = [];
    this.directed = directed;
    this.weighted = weighted;
  }

  /**
   * Adiciona um novo vértice ao grafo.
   * @param {string} id Identificador único do exercício.
   * @param {Object} data Informações adicionais (músculo, equipamento etc.).
   */
  addVertex(id, data = {}) {
    if (!this.vertices.has(id)) {
      this.vertices.set(id, { id, ...data });
    }
  }

  /**
   * Adiciona uma aresta entre dois vértices.
   * @param {string} from Vértice de origem.
   * @param {string} to Vértice de destino.
   * @param {number} weight Peso/custo da transição entre exercícios.
   */
  addEdge(from, to, weight = 1) {
    if (!this.vertices.has(from) || !this.vertices.has(to)) return;
    this.edges.push({ from, to, weight: this.weighted ? weight : 1 });
    if (!this.directed) {
      this.edges.push({ from: to, to: from, weight: this.weighted ? weight : 1 });
    }
  }

  /**
   * Retorna os vizinhos (arestas incidentes) de um vértice.
   * @param {string} vertexId
   * @returns {Array<{ id:string, weight:number }>}
   */
  getNeighbors(vertexId) {
    return this.edges
      .filter((edge) => edge.from === vertexId)
      .map((edge) => ({ id: edge.to, weight: edge.weight }));
  }

  /**
   * Calcula o grau de um vértice (nº de arestas de saída).
   * @param {string} vertexId
   * @returns {number}
   */
  getDegree(vertexId) {
    return this.getNeighbors(vertexId).length;
  }

  /**
    * @returns {number[][]} Matriz de adjacência.
    */
  toAdjacencyMatrix() {
    const ids = [...this.vertices.keys()];
    const size = ids.length;
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));

    this.edges.forEach(({ from, to, weight }) => {
      const i = ids.indexOf(from);
      const j = ids.indexOf(to);
      if (i !== -1 && j !== -1) {
        matrix[i][j] = weight;
      }
    });

    return { ids, matrix };
  }

  /**
   * @returns {Record<string, Array<{ neighbor:string, weight:number }>>}
   */
  toAdjacencyList() {
    const list = {};
    this.vertices.forEach((_, id) => {
      list[id] = this.getNeighbors(id);
    });
    return list;
  }
}

window.GraphRepresentation = {
  Graph,
};
