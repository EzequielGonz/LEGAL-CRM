# Mapa del código (Graphify, 22/11)

Grafo de conocimiento del panel armado con [Graphify](https://github.com/Graphify-Labs/graphify) (`graphifyy` 0.9.115), solo con el análisis de código (tree-sitter, sin IA y sin costo): 890 archivos de `src/` y `supabase/`, 5541 nodos, 8314 relaciones, 572 comunidades.

- `GRAPH_REPORT.md`: resumen por comunidades (qué módulos se tocan con cuáles). Leerlo antes de un cambio grande.
- `graph.json`: el grafo para consultar con `graphify path "A" "B"`, `graphify explain "X"`, `graphify query`.
- `graph.html`: vista interactiva (abrir local; no se publica en el panel porque muestra la estructura del código).

Cómo regenerarlo (lo hace Claude al cerrar una vuelta grande):

```bash
uv tool install graphifyy && graphify install
mkdir /tmp/grafo && cp -r src supabase /tmp/grafo && cd /tmp/grafo && graphify update .
cp graphify-out/{GRAPH_REPORT.md,graph.json,graph.html} <repo>/cerebro/mapa-codigo/
```

Uso para agentes: antes de buscar con grep, `graphify explain "motor.ts" --graph cerebro/mapa-codigo/graph.json` o `graphify path "jarvis" "catalogo.ts" --graph cerebro/mapa-codigo/graph.json`.
