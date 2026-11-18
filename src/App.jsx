import { useEffect, useMemo, useRef, useState } from 'react';
import ActivityPanel from './components/ActivityPanel.jsx';
import NetworkDiagram, { NodeLegend } from './components/NetworkDiagram.jsx';
import { Messages, ResultsTable, Summary } from './components/Results.jsx';
import { computeCPM, exampleActs, resultsAsTSV } from './lib/cpm.js';

// Mismas claves que la versión HTML, para conservar los datos guardados
function loadActs() {
  try {
    const s = JSON.parse(localStorage.getItem('cpm-acts'));
    if (Array.isArray(s) && s.length) return s;
  } catch { /* sin datos guardados */ }
  return exampleActs();
}
function loadRound() {
  try { return localStorage.getItem('cpm-round') === '1'; } catch { return false; }
}

export default function App() {
  const [acts, setActs] = useState(loadActs);
  const [roundUp, setRoundUp] = useState(loadRound);
  const [toastMsg, setToastMsg] = useState({ text: '', visible: false });
  const toastTimer = useRef();

  useEffect(() => {
    try {
      localStorage.setItem('cpm-acts', JSON.stringify(acts));
      localStorage.setItem('cpm-round', roundUp ? '1' : '0');
    } catch { /* almacenamiento no disponible */ }
  }, [acts, roundUp]);

  const { errs, warns, result } = useMemo(() => computeCPM(acts, roundUp), [acts, roundUp]);

  const toast = text => {
    setToastMsg({ text, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(t => ({ ...t, visible: false })), 1600);
  };

  const copyTable = async () => {
    if (!result) { toast('Nada que copiar'); return; }
    try {
      await navigator.clipboard.writeText(resultsAsTSV(result));
      toast('Tabla copiada (pégala en Excel)');
    } catch {
      toast('No se pudo copiar');
    }
  };

  return (
    <>
      <header>
        <h1>Calculadora de ruta crítica</h1>
        <p>Escribe actividades, duraciones y predecesoras: el diagrama y los tiempos se recalculan al instante.</p>
      </header>
      <main>
        <ActivityPanel acts={acts} setActs={setActs} roundUp={roundUp} setRoundUp={setRoundUp} toast={toast} />
        <div className="stack">
          <Messages errs={errs} warns={warns} />
          <Summary result={result} />
          <section className="panel">
            <h2>Diagrama de red</h2>
            <div className="diagWrap"><NetworkDiagram result={result} /></div>
            <div className="legend">
              <NodeLegend />
              <span>Ruta crítica en <b style={{ color: 'var(--crit)' }}>naranja</b> (holgura 0)</span>
            </div>
          </section>
          <ResultsTable result={result} onCopy={copyTable} />
        </div>
      </main>
      <div className="toast" style={{ opacity: toastMsg.visible ? 1 : 0 }}>{toastMsg.text}</div>
    </>
  );
}
