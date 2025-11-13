/* Rabin-Karp */
function rabinKarpFind(text, pattern) {
  const base = 256,
    mod = 1_000_000_007;
  const n = text.length,
    m = pattern.length;
  if (m === 0 || m > n) return { pos: [], comps: 0, confirms: 0 };

  let hp = 0,
    ht = 0,
    power = 1;
  for (let i = 0; i < m - 1; i++) power = (power * base) % mod;

  for (let i = 0; i < m; i++) {
    hp = (hp * base + pattern.charCodeAt(i)) % mod;
    ht = (ht * base + text.charCodeAt(i)) % mod;
  }

  let comps = 0,
    confirms = 0,
    pos = [];
  for (let i = 0; i <= n - m; i++) {
    comps++;
    if (hp === ht) {
      let ok = true;
      for (let j = 0; j < m; j++) {
        confirms++;
        if (text[i + j] !== pattern[j]) {
          ok = false;
          break;
        }
      }
      if (ok) pos.push(i);
    }
    if (i < n - m) {
      ht = (ht - ((text.charCodeAt(i) * power) % mod) + mod) % mod;
      ht = (ht * base + text.charCodeAt(i + m)) % mod;
    }
  }
  return { pos, comps, confirms };
}

function rabinKarp(arr, pattern) {
  const t0 = performance.now();
  const p = norm(pattern);
  let comps = 0,
    confirms = 0;
  const results = [];
  for (const ex of arr) {
    const txt = norm(ex.name);
    const r = rabinKarpFind(txt, p);
    comps += r.comps;
    confirms += r.confirms;
    if (r.pos.length) results.push(ex);
  }
  return {
    results,
    metrics: {
      comps,
      confirms,
      time: performance.now() - t0,
      algo: 'Rabin-Karp',
    },
  };
}
