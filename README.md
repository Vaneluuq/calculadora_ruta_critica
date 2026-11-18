# Calculadora de ruta crítica (CPM)

App web en React (Vite) para resolver diagramas de red (método de la ruta crítica) al instante.

## Qué hace
- Introduces cada actividad con su **duración** y sus **predecesoras** (en tabla o como texto).
- Calcula inicio/fin temprano, inicio/fin tardío, holgura total y libre.
- Muestra la **duración del proyecto** y todas las **rutas críticas**.
- Dibuja el diagrama de red con nodos en formato 3×3:

| Inicio temprano | | Fin temprano |
|:-:|:-:|:-:|
| Holgura | **Actividad** | Holgura |
| Inicio tardío | Duración | Fin tardío |

- Columna **Productividad** para escenarios con recursos adicionales: `1+0.5` (o `1+50%`) divide la duración entre 1,5.
- Botón para copiar la tabla de resultados y pegarla en Excel.

## Formato de texto
Una actividad por línea: `ID duración predecesoras [@productividad]`

```
A 3 -
B 7 A
G 8 C,F
C 10 B @1+0.5
```

## Uso
Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # genera la versión estática en dist/
npm run preview  # sirve dist/ para probarla
```

## Publicación
Cada push a `main` ejecuta `.github/workflows/deploy.yml`: verifica los cálculos (`npm run verificar`), compila y publica `dist/` en GitHub Pages.
Requiere activar una vez **Settings → Pages → Source: GitHub Actions**.

## Estructura
- `src/lib/cpm.js` — cálculo CPM (tiempos, holguras, rutas críticas) y conversión texto ↔ actividades.
- `src/components/ActivityPanel.jsx` — tabla de entrada y edición como texto.
- `src/components/NetworkDiagram.jsx` — diagrama de red en SVG.
- `src/components/Results.jsx` — mensajes, resumen y tabla de tiempos.
- `src/App.jsx` — estado, guardado en `localStorage` y copia al portapapeles.
