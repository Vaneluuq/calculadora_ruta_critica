import { useEffect, useRef, useState } from 'react';
import { exampleActs, fromText, nextId, toText } from '../lib/cpm.js';

const FIELDS = [
  { k: 'id', cls: 'id', placeholder: 'A' },
  { k: 'dur', cls: 'dur', placeholder: '0', inputMode: 'decimal' },
  { k: 'pred', cls: '', placeholder: '—' },
  { k: 'prod', cls: 'prod', placeholder: '1' },
];

export default function ActivityPanel({ acts, setActs, roundUp, setRoundUp, toast }) {
  const inputs = useRef({});
  const [focus, setFocus] = useState(null); // { row, k }
  const [textOpen, setTextOpen] = useState(false);
  const [text, setText] = useState('');

  // Enfoca una celda después de que React haya pintado la fila nueva
  useEffect(() => {
    if (!focus) return;
    inputs.current[`${focus.row}-${focus.k}`]?.focus();
    setFocus(null);
  }, [focus]);

  const update = (i, k, value) => setActs(prev => prev.map((a, j) => (j === i ? { ...a, [k]: value } : a)));

  const addRow = () => {
    setActs(prev => [...prev, { id: nextId(prev), dur: '', pred: '', prod: '' }]);
    setFocus({ row: acts.length, k: 'dur' });
  };

  const onKeyDown = (e, i, k) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i === acts.length - 1) addRow();
    else setFocus({ row: i + 1, k });
  };

  const toggleText = () => {
    if (!textOpen) setText(toText(acts));
    setTextOpen(!textOpen);
  };

  const applyText = () => {
    const a = fromText(text);
    if (!a.length) { toast('No hay líneas válidas'); return; }
    setActs(a);
    setTextOpen(false);
    toast('Actividades actualizadas');
  };

  return (
    <section className="panel">
      <h2>Actividades</h2>
      <table id="inTable">
        <thead>
          <tr><th>Act.</th><th>Dur.</th><th>Predecesoras</th><th>Productiv.</th><th></th></tr>
        </thead>
        <tbody>
          {acts.map((a, i) => (
            <tr key={i}>
              {FIELDS.map(f => (
                <td key={f.k}>
                  <input
                    type="text"
                    className={f.cls}
                    value={a[f.k] ?? ''}
                    placeholder={f.placeholder}
                    inputMode={f.inputMode}
                    ref={el => { inputs.current[`${i}-${f.k}`] = el; }}
                    onChange={e => update(i, f.k, e.target.value)}
                    onKeyDown={e => onKeyDown(e, i, f.k)}
                  />
                </td>
              ))}
              <td>
                <button className="del" title="Eliminar" onClick={() => setActs(prev => prev.filter((_, j) => j !== i))}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="btns">
        <button className="b" onClick={addRow}>+ Añadir actividad</button>
        <button className="b" onClick={toggleText}>Editar como texto</button>
        <button className="b" onClick={() => setActs(exampleActs())}>Cargar ejemplo</button>
        <button className="b" onClick={() => { setActs([{ id: 'A', dur: '', pred: '', prod: '' }]); setFocus({ row: 0, k: 'id' }); }}>
          Limpiar
        </button>
      </div>

      {textOpen && (
        <div className="textPanel">
          <textarea spellCheck="false" autoFocus value={text} onChange={e => setText(e.target.value)} />
          <div className="btns">
            <button className="b primary" onClick={applyText}>Aplicar texto</button>
            <button className="b" onClick={() => setTextOpen(false)}>Cancelar</button>
          </div>
          <div className="hint">
            Una actividad por línea: <code>ID duración predecesoras</code>. Ej.: <code>G 8 C,F</code> · sin predecesoras:{' '}
            <code>A 3 -</code> · con productividad: <code>C 10 B @1+0.5</code>
          </div>
        </div>
      )}

      <label className="chk">
        <input type="checkbox" checked={roundUp} onChange={e => setRoundUp(e.target.checked)} />
        Redondear hacia arriba las duraciones ajustadas por productividad
      </label>
      <div className="hint">
        <b>Productividad</b> (opcional): suma de los recursos asignados. Vacío = 1. <code>1+0.5</code> o <code>1+50%</code> =
        recurso inicial + otro al 50% → duración ÷ 1,5. <code>2</code> = dos recursos iguales → duración ÷ 2. Pulsa{' '}
        <code>Enter</code> en la última fila para añadir otra.
      </div>
    </section>
  );
}
