// Ejecuta los casos de casos.json contra src/lib/cpm.js y muestra qué falla.
// Uso: node .claude/skills/verificar-cpm/verificar.mjs   (o npm run verificar)
import { readFileSync } from 'node:fs';

const cpm = await import(new URL('../../../src/lib/cpm.js', import.meta.url));
const casos = JSON.parse(readFileSync(new URL('./casos.json', import.meta.url), 'utf8'));
const TOL = 1e-3;
const igual = (a, b) => (typeof b === 'number' ? Math.abs(a - b) < TOL : a === b);

let fallos = 0;
for (const caso of casos) {
  const problemas = [];
  const acts = cpm.fromText(caso.texto);
  const { errs, warns, result } = cpm.computeCPM(acts, !!caso.roundUp);
  const e = caso.esperado;

  if (e.sinResultado) {
    if (result) problemas.push('se esperaba que no hubiera resultado');
  } else if (!result) {
    problemas.push(`no hay resultado (errores: ${errs.join(' | ') || 'ninguno'})`);
  } else {
    if (e.T !== undefined && !igual(result.T, e.T)) problemas.push(`T = ${result.T}, se esperaba ${e.T}`);
    if (e.rutas) {
      const got = result.paths.map(p => p.join('-')).sort();
      const exp = e.rutas.map(p => p.join('-')).sort();
      if (JSON.stringify(got) !== JSON.stringify(exp)) problemas.push(`rutas = ${got.join(', ')}, se esperaba ${exp.join(', ')}`);
    }
    for (const [id, campos] of Object.entries(e.nodos || {})) {
      const n = result.map.get(id);
      if (!n) { problemas.push(`falta la actividad ${id}`); continue; }
      for (const [k, v] of Object.entries(campos)) {
        if (!igual(n[k], v)) problemas.push(`${id}.${k} = ${n[k]}, se esperaba ${v}`);
      }
    }
  }

  // Mensajes: si se indica la lista, deben coincidir en número y cada texto esperado debe aparecer
  for (const [tipo, got, exp] of [['errores', errs, e.errores], ['avisos', warns, e.avisos]]) {
    if (!exp) continue;
    if (got.length !== exp.length) problemas.push(`${tipo}: ${got.length} (${got.join(' | ')}), se esperaban ${exp.length}`);
    for (const txt of exp) if (!got.some(m => m.includes(txt))) problemas.push(`falta el mensaje de ${tipo.slice(0, -1)}: "${txt}"`);
  }

  // El modo texto debe ser reversible
  const vuelta = cpm.toText(cpm.fromText(cpm.toText(acts)));
  if (vuelta !== cpm.toText(acts)) problemas.push('toText/fromText no es reversible');

  if (problemas.length) {
    fallos++;
    console.log(`✗ ${caso.nombre}`);
    problemas.forEach(p => console.log(`    - ${p}`));
  } else {
    console.log(`✓ ${caso.nombre}`);
  }
}

console.log(`\n${casos.length - fallos}/${casos.length} casos correctos`);
process.exit(fallos ? 1 : 0);
