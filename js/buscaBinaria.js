/* Busca binária (lowerBound / upperBound / binarySearch) */

function lowerBound(arr, prefix) {
  const p = norm(prefix);
  let lo = 0,
    hi = arr.length,
    comps = 0;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    comps++;
    if (norm(arr[mid].name) < p) lo = mid + 1;
    else hi = mid;
  }
  return { idx: lo, comps };
}

function upperBound(arr, prefix) {
  const p = norm(prefix) + '\uffff';
  let lo = 0,
    hi = arr.length,
    comps = 0;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    comps++;
    if (norm(arr[mid].name) <= p) lo = mid + 1;
    else hi = mid;
  }
  return { idx: lo, comps };
}

function binarySearch(arrSortedByName, term) {
  const t0 = performance.now();
  const lb = lowerBound(arrSortedByName, term);
  const ub = upperBound(arrSortedByName, term);
  const results = arrSortedByName.slice(lb.idx, ub.idx);
  const comps = lb.comps + ub.comps;
  return {
    results,
    metrics: { comps, time: performance.now() - t0, algo: 'Binária' },
  };
}
