# Graph Report - gcer  (2026-11-23)

## Corpus Check
- 375 files · ~71,315 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .ttf 3, (none) 1, .css 1)

## Summary
- 383 nodes · 985 edges · 24 communities (16 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- mkt.js
- numpy
- json
- espaciar.py
- armar
- ref_playwright
- escenas/vita.js
- package.json
- Reglas comunes del CRM multirubro
- revisar-piezas.mjs
- CRM multirubro · instrucciones para Claude
- Dirección de arte, redacción y revisión de piezas de redes
- Identidad de las cuatro marcas para redes
- Series, ganchos y volumen orgánico
- Bandeja para Claude · cómo la trabaja Claude
- VITA · textos de las publicaciones del boceto
- preparar.sh
- casos-de-aceptacion.md
- render_h.sh script
- render2.sh
- render3.sh
- render.sh

## God Nodes (most connected - your core abstractions)
1. `armar()` - 39 edges
2. `armar()` - 23 edges
3. `bp()` - 21 edges
4. `clamp()` - 20 edges
5. `armar()` - 20 edges
6. `obra()` - 18 edges
7. `hash()` - 17 edges
8. `id()` - 17 edges
9. `armar()` - 17 edges
10. `armar()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `armar()` --calls--> `percha()`  [EXTRACTED]
  referencias/redes/herramientas/historias-prototipo/historias/mkt.js → referencias/redes/herramientas/historias-prototipo/historia/decor.js
- `viento()` --calls--> `bp()`  [INFERRED]
  referencias/redes/herramientas/historias-prototipo/sonido.py → referencias/redes/herramientas/reels/build.py
- `viento()` --calls--> `bp()`  [INFERRED]
  referencias/redes/herramientas/historias-prototipo/sonido.py → referencias/redes/herramientas/reels/build.py
- `armar()` --calls--> `clamp()`  [EXTRACTED]
  referencias/redes/herramientas/historias-prototipo/historias/vita.js → referencias/redes/herramientas/historias-prototipo/historia/base.js
- `armar()` --calls--> `lerp()`  [EXTRACTED]
  referencias/redes/herramientas/historias-prototipo/historias/vita.js → referencias/redes/herramientas/historias-prototipo/historia/base.js

## Import Cycles
- None detected.

## Communities (24 total, 8 thin omitted)

### Community 0 - "mkt.js"
Cohesion: 0.16
Nodes (46): backOut(), clamp(), ease(), easeIn(), easeOut(), escena(), expoOut(), globo() (+38 more)

### Community 1 - "numpy"
Cohesion: 0.13
Nodes (43): amb_ciudad(), amb_interior(), amb_reloj(), choque(), colectivo_pasa(), generico(), viento(), lapicera() (+35 more)

### Community 2 - "json"
Cohesion: 0.11
Nodes (20): edge(), load(), main(), piper(), proc(), align(), breath(), load() (+12 more)

### Community 3 - "espaciar.py"
Cohesion: 0.11
Nodes (20): anotar(), cumple(), desde_pieza(), dt(), puntaje(), reels_del_dia(), salidas(), tema() (+12 more)

### Community 4 - "armar"
Cohesion: 0.15
Nodes (31): boca(), hash(), id(), arbol(), auto(), barrio(), blur(), calendario() (+23 more)

### Community 5 - "ref_playwright"
Cohesion: 0.07
Nodes (20): {chromium}, fs, {chromium}, fs, {chromium}, fs, {chromium}, fs (+12 more)

### Community 6 - "escenas/vita.js"
Cohesion: 0.20
Nodes (20): armar(), backOut(), clamp(), crear(), easeInOut(), easeOut(), expoOut(), hash() (+12 more)

### Community 7 - "package.json"
Cohesion: 0.17
Nodes (12): three, author, dependencies, three@^0.170.0, description, keywords, license, main (+4 more)

### Community 8 - "Reglas comunes del CRM multirubro"
Cohesion: 0.17
Nodes (11): 10. Automatizaciones externas (SEO, contenido, entrenamiento), 1. Estados de evidencia, 2. Acceso, identidad y relaciones, 3. Captación por rubro, 4. Horarios: dos políticas distintas, 5. Circuito de seguimiento y citas, 6. Detención, respeto y atención humana, 7. Después de derivar (+3 more)

### Community 9 - "revisar-piezas.mjs"
Cohesion: 0.18
Nodes (6): { chromium }, columnas, [entrada, salida, escalaTxt = '2'], escala, informe, ZONAS

### Community 10 - "CRM multirubro · instrucciones para Claude"
Cohesion: 0.20
Nodes (9): Comandos, Convenciones, CRM multirubro · instrucciones para Claude, Decisiones de la responsable que se respetan (no son trabas de proceso), Leer primero, Oficio que se mantiene, Regla número uno (22/11): arranque obligatorio para todos, Skills, plugins, agentes y roles (15/11 y 20/11) (+1 more)

### Community 11 - "Dirección de arte, redacción y revisión de piezas de redes"
Cohesion: 0.20
Nodes (9): 1. Antes de diseñar: la ficha de la pieza, 2. Composición, 3. Preparación y archivo final: siempre separados, 4. Redacción, 5. Investigación y viralidad, 6. Animación (reels), 7. Revisión visual obligatoria antes de entregar, 8. Producción técnica (sin costo) (+1 more)

### Community 12 - "Identidad de las cuatro marcas para redes"
Cohesion: 0.25
Nodes (7): Automotores Kocos (0 km), Compara tu Obra Social (coberturas médicas), Contradicciones detectadas (decide la responsable), Estudio Jurídico VITA, Identidad de las cuatro marcas para redes, Kocos Marketing, Recursos que faltan

### Community 13 - "Series, ganchos y volumen orgánico"
Cohesion: 0.25
Nodes (7): Cuánto rinde cada guion, Producción, Qué rinde en cada rubro (referencias revisadas el 09/11/2026), Reciclado, Series, ganchos y volumen orgánico, Series por marca, Volumen diario por marca

### Community 14 - "Bandeja para Claude · cómo la trabaja Claude"
Cohesion: 0.40
Nodes (4): Al recibir «ok», Bandeja para Claude · cómo la trabaja Claude, Límites (no cambian por estar en la bandeja), Qué es

### Community 15 - "VITA · textos de las publicaciones del boceto"
Cohesion: 0.50
Nodes (3): Carrusel «Antes de firmar», 7 láminas de 1080 × 1350, Reel «Antes de firmar», mini historia, VITA · textos de las publicaciones del boceto

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `armar()` connect `armar` to `mkt.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `numpy` be split into smaller, more focused modules?**
  _Cohesion score 0.1276595744680851 - nodes in this community are weakly interconnected._
- **Why does `three` connect `package.json` to `escenas/vita.js`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Should `json` be split into smaller, more focused modules?**
  _Cohesion score 0.1091581868640148 - nodes in this community are weakly interconnected._
- **Should `espaciar.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10634920634920635 - nodes in this community are weakly interconnected._
- **Should `ref_playwright` be split into smaller, more focused modules?**
  _Cohesion score 0.07130124777183601 - nodes in this community are weakly interconnected._