// Lógica del método de la ruta crítica (CPM), sin dependencias de React.

export const EPS = 1e-9;

const EXAMPLE = [
  ['A', '3', ''], ['B', '7', 'A'], ['C', '10', 'B'], ['F', '9', 'B'], ['I', '11', 'B'],
  ['D', '1', 'C'], ['E', '4', 'D'], ['G', '8', 'C,F'], ['H', '4', 'G'], ['J', '6', 'H,I'], ['K', '3', 'E,J'],
];
export const exampleActs = () => EXAMPLE.map(([id, dur, pred]) => ({ id, dur, pred, prod: '' }));

export function fmt(v) {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, '').replace('.', ',');
}

// "1+0.5", "1+50%", "2" → suma de recursos. Vacío = 1. Inválido = NaN.
export function parseProd(s) {
  s = String(s || '').trim();
  if (!s) return 1;
  let sum = 0;
  for (let t of s.split('+')) {
    t = t.trim().replace(',', '.');
    const pct = t.endsWith('%');
    if (pct) t = t.slice(0, -1);
    if (!/^\d*\.?\d+$/.test(t)) return NaN;
    const v = parseFloat(t);
    sum += pct ? v / 100 : v;
  }
  return sum;
}

export function nextId(acts) {
  const ids = new Set(acts.map(a => String(a.id).trim().toUpperCase()));
  for (let i = 0; i < 26 * 27; i++) {
    const s = i < 26
      ? String.fromCharCode(65 + i)
      : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26));
    if (!ids.has(s)) return s;
  }
  return '';
}

export const isCritEdge = (u, v) => u.crit && v.crit && Math.abs(u.EF - v.ES) < EPS;

/**
 * Calcula tiempos, holguras y rutas críticas.
 * Devuelve { errs, warns, result } donde result es null si no hay nada que mostrar.
 * result = { nodes (orden topológico), map, T, paths }
 */
export function computeCPM(acts, roundUp) {
  const errs = [], warns = [], nodes = [], map = new Map();

  acts.forEach((a, idx) => {
    const id = String(a.id || '').trim().toUpperCase();
    if (!id && !String(a.dur || '').trim() && !String(a.pred || '').trim()) return;
    if (!id) { errs.push(`Fila ${idx + 1}: falta el nombre de la actividad.`); return; }
    if (map.has(id)) { errs.push(`La actividad ${id} está repetida.`); return; }
    const ds = String(a.dur || '').trim();
    if (!ds) { warns.push(`${id}: sin duración (se ignora por ahora).`); return; }
    const base = parseFloat(ds.replace(',', '.'));
    if (!isFinite(base) || base < 0) { errs.push(`${id}: la duración "${ds}" no es válida.`); return; }
    const prod = parseProd(a.prod);
    if (!isFinite(prod) || prod <= 0) {
      errs.push(`${id}: la productividad "${a.prod}" no es válida (usa p. ej. 1+0.5).`);
      return;
    }
    let d = base / prod;
    if (roundUp && Math.abs(prod - 1) > EPS) d = Math.ceil(d - EPS);
    const preds = [...new Set(String(a.pred || '').toUpperCase().split(/[\s,;]+/).filter(x => x && x !== '-'))];
    const n = { id, base, prod, d, preds, succs: [], order: idx };
    map.set(id, n);
    nodes.push(n);
  });

  nodes.forEach(n => {
    n.preds = n.preds.filter(p => {
      if (p === n.id) { errs.push(`${n.id} no puede ser predecesora de sí misma.`); return false; }
      if (!map.has(p)) { warns.push(`${n.id}: la predecesora ${p} no existe; se ignora.`); return false; }
      return true;
    });
    n.preds.forEach(p => map.get(p).succs.push(n.id));
  });

  // Orden topológico (Kahn)
  const indeg = new Map(nodes.map(n => [n.id, n.preds.length]));
  const q = nodes.filter(n => !n.preds.length);
  const topo = [];
  while (q.length) {
    const n = q.shift();
    topo.push(n);
    n.succs.forEach(s => {
      indeg.set(s, indeg.get(s) - 1);
      if (indeg.get(s) === 0) q.push(map.get(s));
    });
  }
  if (topo.length < nodes.length) {
    const rest = nodes.filter(n => !topo.includes(n)).map(n => n.id);
    errs.push(`Hay un ciclo en las dependencias entre: ${rest.join(', ')}.`);
    return { errs, warns, result: null };
  }
  if (!nodes.length) return { errs, warns, result: null };

  // Pasada hacia adelante
  topo.forEach(n => {
    n.ES = n.preds.length ? Math.max(...n.preds.map(p => map.get(p).EF)) : 0;
    n.EF = n.ES + n.d;
  });
  const T = Math.max(...nodes.map(n => n.EF));

  // Pasada hacia atrás
  [...topo].reverse().forEach(n => {
    n.LF = n.succs.length ? Math.min(...n.succs.map(s => map.get(s).LS)) : T;
    n.LS = n.LF - n.d;
  });

  nodes.forEach(n => {
    n.TF = n.LS - n.ES;
    if (Math.abs(n.TF) < EPS) n.TF = 0;
    n.crit = n.TF === 0;
    n.FF = (n.succs.length ? Math.min(...n.succs.map(s => map.get(s).ES)) : T) - n.EF;
    if (Math.abs(n.FF) < EPS) n.FF = 0;
  });

  // Rutas críticas (máx. 30)
  const paths = [];
  const dfs = (n, path) => {
    if (paths.length >= 30) return;
    path.push(n.id);
    const nx = n.succs.map(s => map.get(s)).filter(v => isCritEdge(n, v));
    if (!nx.length) {
      if (Math.abs(n.EF - T) < EPS) paths.push([...path]);
    } else nx.forEach(v => dfs(v, path));
    path.pop();
  };
  topo.filter(n => n.crit && n.ES < EPS).forEach(n => dfs(n, []));

  return { errs, warns, result: { nodes: topo, map, T, paths } };
}

// Texto: "ID duración predecesoras [@productividad]"
export function toText(acts) {
  return acts
    .filter(a => String(a.id).trim())
    .map(a => {
      const prod = String(a.prod || '').trim();
      return `${String(a.id).trim().toUpperCase()} ${String(a.dur).trim() || 0} ${String(a.pred).trim().replace(/\s+/g, '') || '-'}${prod ? ' @' + prod.replace(/\s+/g, '') : ''}`;
    })
    .join('\n');
}

export function fromText(t) {
  const out = [];
  t.split(/\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    // Se separa por espacios para que la coma decimal funcione ("A 2,5 C,F").
    // Si la línea no tiene espacios ("A,3,-"), se separa también por comas.
    let toks = line.split(/\s+/);
    if (toks.length < 2) toks = line.split(/[,;]+/);
    toks = toks.filter(Boolean);
    let prod = '';
    const pi = toks.findIndex(x => x.startsWith('@'));
    if (pi >= 0) { prod = toks[pi].slice(1); toks.splice(pi, 1); }
    const pred = toks.slice(2).join(',').split(/[,;]+/).filter(x => x && x !== '-').join(',');
    out.push({ id: toks[0] || '', dur: toks[1] || '', pred, prod });
  });
  return out;
}

export function resultsAsTSV({ nodes, T, paths }) {
  const head = ['Actividad', 'Duración', 'IT', 'FT', 'IP', 'FP', 'Holgura total', 'Holgura libre', 'Crítica'].join('\t');
  const body = [...nodes].sort((a, b) => a.order - b.order)
    .map(n => [n.id, fmt(n.d), fmt(n.ES), fmt(n.EF), fmt(n.LS), fmt(n.LF), fmt(n.TF), fmt(n.FF), n.crit ? 'Sí' : 'No'].join('\t'))
    .join('\n');
  return `${head}\n${body}\n\nDuración del proyecto\t${fmt(T)}\nRuta crítica\t${paths.map(p => p.join('-')).join(' | ')}`;
}
