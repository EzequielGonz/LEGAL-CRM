# Vuelta 6 · parte 6 · La Oficina como el reel

Rama `rediseno5/parte6`. Pedido: «la oficina nada que ver con el video» (reel DfJiHrmipzE).

## Qué cambia en `/oficina`

- **Oficina 3D estilo videojuego, de noche.** Vista aérea de corte (sin techo) que se orbita con el mouse o
  el dedo. Muebles reales del Furniture Kit de Kenney (escritorios, sillas, bibliotecas, plantas, sillones,
  cocina con heladera y banquetas, alfombras, lámparas), cubículos con tabiques, monitores que se encienden
  cuando el puesto trabaja, lámparas colgantes, ventanas con persianas, paredes de vidrio, mesa de pool,
  orbe del Cerebro, árboles, vereda, calle y faroles. Luces cálidas por sala, sombras suaves, tono ACES,
  oclusión ambiental (GTAO) y brillo leve en lámparas (bajan solos si el equipo no da).
- **Personajes animados** (Quaternius): sentados tecleando, quietos, caminando. Los que trabajan llevan la
  carpeta al Cerebro; algunos libres van por un café al living. Cartel flotante «Nombre · estado».
- **Recorrer**: al entrar a una sala la cámara baja a altura de persona. WASD o flechas + arrastrar para
  mirar, Shift corre, clic en el piso para ir; en celular, arrastrar y tocar. Botón «Volver a la vista aérea».
- **Chat con cada agente** (tocándolo en 3D o desde la lista): preguntas rápidas que responde con lo que el
  panel sabe (estado, tarea, avance), y un pedido escrito que va a la mesa de entrada de la Oficina
  (`POST /api/oficina`, con el sector y el puesto) o se abre en Jarvis precargado. No escribe a prospectos.
- **Capa de vidrio como el reel**: barra de arriba (Vista aérea · Recorrer · salas), panel izquierdo con
  cifras (agentes activos, tareas en curso, para tu OK, aprobadas), nueva tarea, para tu OK (aprobar, pedir
  cambios, descartar), agentes y actividad; canal del equipo a la derecha. Carteles con la palabra clave en
  itálica serif recuadrada y botones neumórficos (pedido del dueño sobre el video de diseño). Sin fondo de manchas.

## Se mantiene

Dejar una tarea, «Arrancar ahora», aprobar / pedir cambios / descartar, `?sector=` para abrir una sala, plano
liviano de respaldo (sin WebGL2 o si la escena falla) y la lista accesible de salas y agentes como fuente de
verdad. Con movimiento reducido no hay caminatas ni vuelos de cámara.

## Archivos

- `src/components/cerebro/oficina-reel-3d.tsx` (escena, cámara, personajes, posproceso, carga con %).
- `src/components/cerebro/oficina-reel-mundo.tsx` (arquitectura, muebles, jardín, texturas dibujadas).
- `src/components/cerebro/oficina-visual.tsx` (capa HTML), `oficina.tsx` (envío del chat), `src/app/oficina/`.
- `src/lib/oficina/recorrido.ts` (funciones puras) y `tests/unitarias/oficina-recorrido.test.ts`.
- `public/modelos/oficina/*.glb` y `public/modelos/LICENCIAS.md` (CC0, fuentes anotadas).

Los modelos van sin meshopt ni Draco: la política de seguridad del panel no permite WebAssembly.
Los archivos 3D viejos (`oficina-edificio-3d.tsx`, `oficina-3d.tsx`, `oficina-diorama.tsx`) quedan sin usar, no se borraron.

Sin migraciones de base.
