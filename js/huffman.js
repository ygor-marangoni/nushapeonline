/**
 * Implementação do algoritmo de Huffman para compressão e descompressão.
 * Complexidade:
 *  - Construção da árvore: O(n log n) por causa da ordenação da fila de prioridade.
 *  - Compressão e descompressão: O(n), onde n é o número de símbolos do texto.
 */
(function (global) {
  class HuffmanNode {
    constructor(char, freq, left = null, right = null) {
      this.char = char;
      this.freq = freq;
      this.left = left;
      this.right = right;
    }

    isLeaf() {
      return !this.left && !this.right;
    }
  }

  function buildFrequencyMap(str) {
    const map = {};
    for (const char of str) {
      map[char] = (map[char] || 0) + 1;
    }
    return map;
  }

  function buildHuffmanTree(freqMap) {
    const nodes = Object.entries(freqMap).map(([char, freq]) => new HuffmanNode(char, freq));
    if (nodes.length === 0) return null;
    if (nodes.length === 1) {
      // Se houver apenas um símbolo, duplicamos o nó para manter a estrutura binária.
      const onlyNode = nodes[0];
      return new HuffmanNode(null, onlyNode.freq, onlyNode, null);
    }

    const queue = [...nodes];
    while (queue.length > 1) {
      queue.sort((a, b) => a.freq - b.freq);
      const left = queue.shift();
      const right = queue.shift();
      const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
      queue.push(parent);
    }
    return queue[0];
  }

  function generateCodes(node) {
    const codes = {};
    if (!node) return codes;

    const traverse = (current, path) => {
      if (!current) return;
      if (current.isLeaf()) {
        codes[current.char] = path || '0'; // garante código mesmo com único caractere
        return;
      }
      traverse(current.left, `${path}0`);
      traverse(current.right, `${path}1`);
    };

    traverse(node, '');
    return codes;
  }

  function serializeTree(node) {
    if (!node) return null;
    if (node.isLeaf()) {
      return { char: node.char };
    }
    return {
      left: serializeTree(node.left),
      right: serializeTree(node.right),
    };
  }

  function deserializeTree(obj) {
    if (!obj) return null;
    if (Object.prototype.hasOwnProperty.call(obj, 'char')) {
      return new HuffmanNode(obj.char, 0, null, null);
    }
    const node = new HuffmanNode(null, 0);
    node.left = deserializeTree(obj.left);
    node.right = deserializeTree(obj.right);
    return node;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function computeDepthMetrics(node, depth = 0) {
    if (!node) return { weightedDepth: 0, totalFreq: 0 };
    if (node.isLeaf()) {
      return { weightedDepth: depth * node.freq, totalFreq: node.freq };
    }
    const leftMetrics = computeDepthMetrics(node.left, depth + 1);
    const rightMetrics = computeDepthMetrics(node.right, depth + 1);
    return {
      weightedDepth: leftMetrics.weightedDepth + rightMetrics.weightedDepth,
      totalFreq: leftMetrics.totalFreq + rightMetrics.totalFreq,
    };
  }

  function getTreeHeight(node) {
    if (!node) return 0;
    if (node.isLeaf()) return 1;
    return 1 + Math.max(getTreeHeight(node.left), getTreeHeight(node.right));
  }

  function huffmanCompress(data) {
    const encoder = new TextEncoder();
    const originalBytes = encoder.encode(data).length;

    if (!data || data.length === 0) {
      return {
        compressed: '',
        padding: 0,
        tree: null,
        metrics: {
          originalBytes: 0,
          compressedBytes: 0,
          compressionRatio: 0,
          uniqueChars: 0,
          averageDepth: 0,
          treeHeight: 0,
        },
      };
    }

    const freqMap = buildFrequencyMap(data);
    const tree = buildHuffmanTree(freqMap);
    const codes = generateCodes(tree);

    let bitString = '';
    for (const char of data) {
      bitString += codes[char];
    }

    const padding = (8 - (bitString.length % 8)) % 8;
    bitString += '0'.repeat(padding);

    const byteArray = new Uint8Array(bitString.length / 8);
    for (let i = 0; i < bitString.length; i += 8) {
      const byte = bitString.slice(i, i + 8);
      byteArray[i / 8] = parseInt(byte, 2);
    }

    const compressed = bytesToBase64(byteArray);
    const compressedBytes = byteArray.length;
    const uniqueChars = Object.keys(freqMap).length;
    const { weightedDepth, totalFreq } = computeDepthMetrics(tree);
    const averageDepth = totalFreq ? weightedDepth / totalFreq : 0;
    const treeHeight = getTreeHeight(tree);

    const compressionRatio =
      originalBytes === 0
        ? 0
        : ((originalBytes - compressedBytes) / originalBytes) * 100;

    return {
      compressed,
      padding,
      tree: serializeTree(tree),
      metrics: {
        originalBytes,
        compressedBytes,
        compressionRatio,
        uniqueChars,
        averageDepth,
        treeHeight,
      },
    };
  }

  function huffmanDecompress(payload) {
    if (!payload || !payload.compressed) return '';
    const { compressed, padding = 0, tree } = payload;
    const bytes = base64ToBytes(compressed);
    let bitString = '';
    bytes.forEach((byte) => {
      bitString += byte.toString(2).padStart(8, '0');
    });

    if (padding > 0) {
      bitString = bitString.slice(0, -padding);
    }

    const root = deserializeTree(tree);
    if (!root) return '';

    let result = '';
    let current = root;
    for (const bit of bitString) {
      current = bit === '0' ? current.left : current.right;
      if (!current.left && !current.right) {
        result += current.char;
        current = root;
      }
    }
    return result;
  }

  global.Huffman = {
    huffmanCompress,
    huffmanDecompress,
    buildHuffmanTree,
    generateCodes,
  };
})(window);
