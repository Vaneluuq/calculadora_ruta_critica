# Calculadora de ruta crítica (CPM)

App web de una sola página para resolver diagramas de red (método de la ruta crítica) al instante.

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
Abre `index.html` en el navegador, o activa **GitHub Pages** (Settings → Pages → rama `main`, carpeta `/`).
No requiere instalación ni dependencias.
