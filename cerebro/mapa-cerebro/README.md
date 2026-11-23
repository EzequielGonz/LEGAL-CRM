# Mapa del cerebro y la memoria (Graphify)

Grafo de los documentos del proyecto: `cerebro/**/*.md` (órdenes, estado, pendientes, bitácora, traspasos, chats volcados, biblioteca), `CLAUDE.md` y `.claude/referencias/` (reglas, casos de aceptación, redes). El mapa del **código** está aparte, en `cerebro/mapa-codigo/`.

Uso (antes de buscar con grep):

```bash
graphify explain "accesos" --graph cerebro/mapa-cerebro/graph.json
graphify section "La única restricción" --graph cerebro/mapa-cerebro/graph.json
graphify path "A" "B" --graph cerebro/mapa-cerebro/graph.json
```

Se arma sin modelo de lenguaje (títulos y secciones de los documentos, y el código de ejemplo que contienen). No lleva claves ni datos de prospectos. Para regenerarlo: copiar los `.md` a una carpeta limpia y correr `graphify update .` allí; después copiar `graph.json`, `GRAPH_REPORT.md` y `graph.html` a esta carpeta (sin la carpeta `cache`).
