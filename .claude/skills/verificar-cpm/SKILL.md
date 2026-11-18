---
name: verificar-cpm
description: Verifica que el cálculo de ruta crítica (tiempos, holguras, rutas críticas, mensajes de error y modo texto) sigue siendo correcto. Úsala después de cualquier cambio en src/lib/cpm.js o cuando se pida comprobar los cálculos.
---

# Verificar el cálculo CPM

## 1. Ejecutar los casos

```bash
npm run verificar
```

El script `verificar.mjs` carga `src/lib/cpm.js` y ejecuta cada caso de `casos.json`. En cada caso compara:
- la duración del proyecto `T` y las rutas críticas (sin importar el orden);
- los valores de las actividades indicadas (`d`, `ES`, `EF`, `LS`, `LF`, `TF`, `FF`, `crit`), con una tolerancia de 0,001;
- los errores y avisos: el número de mensajes y que contengan el texto esperado;
- que `toText`/`fromText` sean reversibles.

Termina con código de salida 1 si algún caso falla.

## 2. Si algo falla

- Lee el detalle del caso (`✗`) y decide si el fallo está en el código o si el cambio de comportamiento era intencionado.
- **No cambies un valor esperado de `casos.json` solo para que el caso pase.** Antes, comprueba el valor a mano con las reglas de abajo. Si el cambio era intencionado, actualiza el caso y avisa al usuario.

## 3. Si se añade comportamiento nuevo

Añade un caso a `casos.json`. Todos los campos de `esperado` son opcionales:

```json
{
  "nombre": "Descripción corta",
  "texto": "A 3 -\nB 2 A @1+0.5",
  "roundUp": false,
  "esperado": {
    "T": 4.3333,
    "rutas": [["A", "B"]],
    "nodos": { "B": { "d": 1.3333, "TF": 0 } },
    "errores": ["texto que debe aparecer"],
    "avisos": [],
    "sinResultado": false
  }
}
```

- `errores`/`avisos` vacíos (`[]`) exigen que no haya ningún mensaje de ese tipo. Si se omiten, no se comprueban.
- `sinResultado: true` significa que `computeCPM` debe devolver `result: null`, como cuando hay un ciclo o no hay actividades válidas.

## Reglas para calcular a mano

- ES = máximo EF de las predecesoras (0 si no tiene). EF = ES + d.
- T = máximo EF del proyecto.
- LF = mínimo LS de las sucesoras (T si no tiene). LS = LF − d.
- Holgura total TF = LS − ES. Es crítica si TF = 0.
- Holgura libre FF = (mínimo ES de las sucesoras, o T si no tiene) − EF.
- d = duración ÷ productividad. Con `roundUp`, solo las actividades con productividad ≠ 1 se redondean hacia arriba.

## Formato del modo texto

Cada línea se separa primero por espacios: `ID duración predecesoras [@productividad]`. Así la coma decimal funciona (`A 2,5 C,F`). Las predecesoras se separan por `,` o `;`, con o sin espacios. Una línea sin espacios (`A,3,-`) se separa por comas; en ese formato no se puede usar la coma decimal.
