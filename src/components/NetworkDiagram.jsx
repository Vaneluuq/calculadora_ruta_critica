import { useMemo } from 'react';
import { EPS, fmt, isCritEdge } from '../lib/cpm.js';

const W = 126, H = 102, CG = 64, RG = 26, PAD = 16, R1 = 34, R2 = 68;

// Coloca los nodos por niveles (columnas) y reduce cruces con varias pasadas de baricentro.
function layout(topo, map) {
  const level = new Map(), pos = new Map(), cols = [];
  topo.forEach(n => {
    const lv = n.preds.length ? Math.max(...n.preds.map(p => level.get(p))) + 1 : 0;
    level.set(n.id, lv);
    (cols[lv] = cols[lv] || []).push(n);
  });
  const setPos = c => c.forEach((n, i) => pos.set(n.id, i - (c.length - 1) / 2));
  cols.forEach(c => { c.sort((a, b) => a.order - b.order); setPos(c); });

  for (let it = 0; it < 6; it++) {
    const fwd = it % 2 === 0;
    const idx = cols.map((_, i) => i);
    const seq = fwd ? idx.slice(1) : idx.reverse().slice(1);
    seq.forEach(ci => {
      const c = cols[ci], bc = new Map();
      c.forEach(n => {
        const nb = fwd ? n.preds : n.succs;
        bc.set(n.id, nb.length ? nb.reduce((s, x) => s + pos.get(x), 0) / nb.length : pos.get(n.id));
      });
      c.sort((a, b) => bc.get(a.id) - bc.get(b.id));
      setPos(c);
    });
  }

  const maxRows = Math.max(...cols.map(c => c.length));
  const height = PAD * 2 + maxRows * H + (maxRows - 1) * RG;
  const width = PAD * 2 + cols.length * W + (cols.length - 1) * CG;
  const cy = height / 2;
  const xy = new Map(topo.map(n => [n.id, {
    x: PAD + level.get(n.id) * (W + CG),
    y: cy + pos.get(n.id) * (H + RG) - H / 2,
  }]));
  return { xy, width, height };
}

function Node({ n, x, y }) {
  const c = n.crit ? ' c' : '';
  const w3 = W / 3;
  const adj = Math.abs(n.prod - 1) > EPS;
  const hz = `n-num hz${n.crit ? '' : ' m'}`;
  const mid = y + (R1 + R2) / 2 + 5;
  return (
    <g>
      <title>{`${n.id}: duración ${fmt(n.d)}${adj ? ` (${fmt(n.base)} ÷ ${fmt(n.prod)})` : ''}, holgura ${fmt(n.TF)}`}</title>
      <rect x={x} y={y} width={W} height={H} rx="6" className={`n-rect${c}`} />
      <line x1={x} y1={y + R1} x2={x + W} y2={y + R1} className={`n-div${c}`} />
      <line x1={x} y1={y + R2} x2={x + W} y2={y + R2} className={`n-div${c}`} />
      <line x1={x + w3} y1={y} x2={x + w3} y2={y + H} className={`n-div${c}`} />
      <line x1={x + 2 * w3} y1={y} x2={x + 2 * w3} y2={y + H} className={`n-div${c}`} />
      <text x={x + w3 / 2} y={y + R1 / 2 + 5} textAnchor="middle" className="n-num">{fmt(n.ES)}</text>
      <text x={x + W - w3 / 2} y={y + R1 / 2 + 5} textAnchor="middle" className="n-num">{fmt(n.EF)}</text>
      <text x={x + w3 / 2} y={mid} textAnchor="middle" className={hz}>{fmt(n.TF)}</text>
      <text x={x + W / 2} y={mid + 1} textAnchor="middle" className={`n-id${c}`}>{n.id}</text>
      <text x={x + W - w3 / 2} y={mid} textAnchor="middle" className={hz}>{fmt(n.TF)}</text>
      <text x={x + w3 / 2} y={y + (R2 + H) / 2 + 5} textAnchor="middle" className="n-num">{fmt(n.LS)}</text>
      <text x={x + W / 2} y={y + (R2 + H) / 2 + 5} textAnchor="middle" className="n-num hz">{fmt(n.d)}</text>
      {adj && (
        <text x={x + W / 2} y={y + H - 3} textAnchor="middle" className="n-badge" style={{ fontSize: '8.5px' }}>
          ÷{fmt(n.prod)}
        </text>
      )}
      <text x={x + W - w3 / 2} y={y + (R2 + H) / 2 + 5} textAnchor="middle" className="n-num">{fmt(n.LF)}</text>
    </g>
  );
}

export default function NetworkDiagram({ result }) {
  const lay = useMemo(() => (result ? layout(result.nodes, result.map) : null), [result]);
  if (!result) return <svg width="0" height="0" />;

  const { nodes, map } = result;
  const { xy, width, height } = lay;
  const edges = [], critEdges = [];
  nodes.forEach(u => u.succs.forEach(s => {
    const v = map.get(s), pu = xy.get(u.id), pv = xy.get(v.id);
    const x1 = pu.x + W, y1 = pu.y + H / 2, x2 = pv.x - 2, y2 = pv.y + H / 2;
    const dx = Math.max(28, (x2 - x1) * 0.45);
    const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    if (isCritEdge(u, v)) critEdges.push(<path key={`${u.id}-${s}`} d={d} className="e c" markerEnd="url(#ac)" />);
    else edges.push(<path key={`${u.id}-${s}`} d={d} className="e" markerEnd="url(#a)" />);
  }));

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--edge)' }} />
        </marker>
        <marker id="ac" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--crit)' }} />
        </marker>
      </defs>
      {edges}
      {critEdges}
      {nodes.map(n => <Node key={n.id} n={n} {...xy.get(n.id)} />)}
    </svg>
  );
}

export function NodeLegend() {
  const b = 'n-badge';
  return (
    <svg width="200" height="86" viewBox="0 0 200 86">
      <rect x="1" y="1" width="198" height="84" rx="6" className="n-rect" />
      <line x1="1" y1="29" x2="199" y2="29" className="n-div" />
      <line x1="1" y1="57" x2="199" y2="57" className="n-div" />
      <line x1="67" y1="1" x2="67" y2="85" className="n-div" />
      <line x1="133" y1="1" x2="133" y2="85" className="n-div" />
      <text x="34" y="13" textAnchor="middle" className={b}>Inicio</text>
      <text x="34" y="24" textAnchor="middle" className={b}>temprano</text>
      <text x="166" y="13" textAnchor="middle" className={b}>Fin</text>
      <text x="166" y="24" textAnchor="middle" className={b}>temprano</text>
      <text x="34" y="47" textAnchor="middle" className={b}>Holgura</text>
      <text x="100" y="47" textAnchor="middle" className={b} style={{ fontSize: '11px', fontWeight: 600 }}>Actividad</text>
      <text x="166" y="47" textAnchor="middle" className={b}>Holgura</text>
      <text x="34" y="69" textAnchor="middle" className={b}>Inicio</text>
      <text x="34" y="80" textAnchor="middle" className={b}>tardío</text>
      <text x="100" y="75" textAnchor="middle" className={b}>Duración</text>
      <text x="166" y="69" textAnchor="middle" className={b}>Fin</text>
      <text x="166" y="80" textAnchor="middle" className={b}>tardío</text>
    </svg>
  );
}
