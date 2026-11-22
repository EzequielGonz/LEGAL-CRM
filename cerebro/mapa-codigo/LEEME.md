# Mapa del código (Graphify)

Grafo de conocimiento de `src/`, `supabase/` y `tests/`, armado el 22/11/2026 con Graphify 0.9.115. Solo análisis local del código (tree-sitter): 0 tokens, nada sale de la máquina. No incluye documentos ni imágenes (esa pasada usa un modelo y cuesta).

- Consultar antes de buscar con grep: `graphify explain "X" --graph cerebro/mapa-codigo/graph.json`, `graphify query "pregunta" --graph ...`, `graphify path "A" "B" --graph ...`.
- Resumen legible: `GRAPH_REPORT.md`. Vista en el navegador: `graph.html`.
- Cada ruta en el grafo es relativa a la raíz del repo.
- **Actualizar** (cada vez que cambie bastante el código): copiar `src`, `supabase` y `tests` a una carpeta vacía, correr `graphify update .` ahí (hace falta `graphifyy[sql]` para las migraciones) y copiar de nuevo `graph.json`, `GRAPH_REPORT.md` y `graph.html` a esta carpeta. El hook `.claude/hooks/graphify.sh` instala el CLI al arrancar si falta.
- Es una foto: si el código cambió después del 22/11, el mapa puede quedar atrás.
