import { EPS, fmt } from '../lib/cpm.js';

export function Messages({ errs, warns }) {
  return (
    <div className="msgs">
      {errs.map((e, i) => <div key={`e${i}`} className="e">{e}</div>)}
      {warns.map((w, i) => <div key={`w${i}`} className="w">{w}</div>)}
    </div>
  );
}

export function Summary({ result }) {
  return (
    <section className="panel">
      <div className="kpis">
        <div className="kpi">
          <div className="v">{result ? fmt(result.T) : '–'}</div>
          <div className="l">Duración del proyecto</div>
        </div>
        <div className="paths">
          {!result ? (
            <span style={{ color: 'var(--muted)' }}>Añade actividades para calcular.</span>
          ) : (
            <>
              <div className="l">{result.paths.length > 1 ? `${result.paths.length} rutas críticas` : 'Ruta crítica'}</div>
              {result.paths.map((p, i) => (
                <div className="path" key={i}>
                  {p.map((id, j) => (
                    <span key={id} style={{ display: 'contents' }}>
                      {j > 0 && <span className="arrow">→</span>}
                      <span className="chip">{id}</span>
                    </span>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function ResultsTable({ result, onCopy }) {
  const rows = result ? [...result.nodes].sort((a, b) => a.order - b.order) : [];
  return (
    <section className="panel">
      <div className="row-between">
        <h2>Tabla de tiempos</h2>
        <button className="b" onClick={onCopy}>Copiar tabla</button>
      </div>
      <div className="tableWrap">
        <table id="resTable">
          <thead>
            <tr>
              <th>Act.</th><th>Dur.</th><th>IT</th><th>FT</th><th>IP</th><th>FP</th>
              <th>Holg. total</th><th>Holg. libre</th><th>Crítica</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(n => (
              <tr key={n.id} className={n.crit ? 'c' : ''}>
                <td>{n.id}</td>
                <td>
                  {fmt(n.d)}
                  {Math.abs(n.prod - 1) > EPS && (
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}> ({fmt(n.base)}÷{fmt(n.prod)})</span>
                  )}
                </td>
                <td>{fmt(n.ES)}</td><td>{fmt(n.EF)}</td><td>{fmt(n.LS)}</td><td>{fmt(n.LF)}</td>
                <td>{fmt(n.TF)}</td><td>{fmt(n.FF)}</td><td>{n.crit ? 'Sí' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
