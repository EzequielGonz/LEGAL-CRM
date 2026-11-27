#!/usr/bin/env bash
# 22/11 · Graphify en todas las sesiones (orden del dueño: «instalalo en todos lados»).
# Instala el CLI en segundo plano si falta (no frena el arranque) y avisa dónde está el mapa del código.
export PATH="$HOME/.local/bin:$PATH"
if ! command -v graphify >/dev/null 2>&1; then
  ( (command -v uv >/dev/null 2>&1 && uv tool install -q graphifyy) || pipx install graphifyy || pip install -q --user graphifyy ) >/dev/null 2>&1 &
fi
RAIZ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
if [ -f "$RAIZ/cerebro/mapa-codigo/graph.json" ]; then
  echo "Graphify: mapa del código en cerebro/mapa-codigo/ (graphify explain \"X\" --graph cerebro/mapa-codigo/graph.json). Consultalo antes de buscar con grep."
fi
if [ -f "$RAIZ/cerebro/mapa-cerebro/graph.json" ]; then
  echo "Graphify: mapa del cerebro y la memoria (documentos) en cerebro/mapa-cerebro/ (graphify section \"X\" --graph cerebro/mapa-cerebro/graph.json)."
fi
