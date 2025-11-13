/* Busca sequencial */
function sequentialSearch(arr, term) {
  const start = performance.now();
  let comps = 0;
  const q = norm(term);
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    const hay = norm(arr[i].name);
    comps++;
    if (hay.includes(q)) results.push(arr[i]);
  }
  return {
    results,
    metrics: { comps, time: performance.now() - start, algo: 'Sequencial' },
  };
}
