# Oficina 3D (22/11): entrega

Rama del repaso: `diseno/oficina-3d-repaso-2211`. Parte de la rama `diseno/oficina-3d-2211`, ya integrada en main.

## Qué incluye

- **Escena 3D de la sala** (`src/components/cerebro/oficina-3d.tsx`): ocho escritorios (Dirección, Análisis, Redes, Diseño, SEO, Bots, Ingeniería y Asistente), cada uno con cubículo de vidrio, escritorio, monitor con punto de estado, lámpara, planta y un personaje del color de su escritorio. Todo con primitivas: no baja modelos.
- **Tarjeta flotante** sobre cada agente con el nombre, qué hace en palabras simples, la barra de avance y el estado: «Trabajando» (amarillo), «Listo para tu OK» (verde), «En cola» y «Libre» (gris). Cada estado lleva ícono y texto, no solo color.
- **Cámara por presets** (sin órbita libre): sala, «Ver toda la oficina» (vista de planta) y primer plano de cada escritorio, con «Anterior» y «Siguiente». Al elegir un escritorio se abre un panel de vidrio con su tarea y los botones de siempre (Aprobar, Pedir cambios, Descartar).
- **Versión liviana** (`oficina-diorama.tsx`): diorama CSS 3D con los mismos ocho puestos y estados, para celular (menos de 768 px), equipos sin WebGL, movimiento reducido y mientras carga la escena 3D.
- **Lista accesible** (`oficina-visual.tsx`): siempre presente, es la fuente de verdad. La escena y el diorama son decorativos (`aria-hidden`). Un aviso `aria-live` anuncia cuando un escritorio termina algo (como máximo uno cada 10 s).
- **Lógica visual pura** (`src/lib/oficina/escena.ts`) con sus pruebas (`tests/unitarias/oficina-escena.test.ts`).
- «Arrancar ahora» y «Dejar una tarea» quedan como dos botones arriba de la escena.

## Qué cambió en el repaso (22/11)

| Tema | Antes | Ahora |
|---|---|---|
| Festejo | Festejaba el escritorio que quedaba «Listo para tu OK», o sea casi siempre Dirección | Festeja el escritorio que **terminó su parte** (suma una parte hecha en una tarea abierta), cualquiera sea. Una sola vez, con destello. Al abrir la página no festeja nadie. Regla en `areasQueTerminaron` y `partesHechas` |
| Estado de un escritorio que ya dejó su parte | Decía «Sin tareas ahora» | Dice «Ya dejó su parte. Ahora sigue el próximo escritorio.» |
| Fondo | Fondo violeta fuera de la sala y puntos de colores en el diorama | Fondo neutro del panel (`--bg2`). El diorama es una pieza que flota sobre ese fondo; el ventanal con la ciudad de noche queda solo dentro de la sala (es del video de referencia) |
| Botones | Seis botones sobre la escena | Cuatro de vista; «Pausar animaciones» y «Ver en 3D / versión liviana» pasaron a un desplegable «Ajustes de la vista». Todos de 44 px de alto |
| Tarjetas | Ancho fijo de 198 px: se pisaban en pantallas angostas | Ancho según el escenario (`cqw`), más chicas en la vista de planta |
| Contraste | La leyenda usaba el gris más apagado del panel (menos de 4,5:1) | Usa el gris de lectura del panel |
| Grupo de vista | `role="toolbar"` sin navegación con flechas | `role="group"` con nombre |
| Cambio 3D a liviana y de vuelta | La escena podía quedar en blanco | Se reinicia el estado de carga |
| Rendimiento | Todos los puestos se redibujaban con cada tic de glifos | `memo` en el puesto y el tic solo le llega al que tiene glifo |
| Textos | Glifo «...» en Bots | «ia» |

## Qué no cambió

Las reglas de `reglas.ts`, las rutas `/api/oficina`, `/api/oficina/arrancar` y `/api/oficina/[id]`, la base y las migraciones.

## Cómo probarlo

1. `npm ci`
2. `npm run typecheck && npx tsc -p tests/tsconfig.json --noEmit`
3. `npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts`
4. `npm run build` (en este entorno hace falta `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` por la descarga de las fuentes)
5. Abrir `/cerebro`, sección «La oficina».

## Base de datos

Sin cambios: no hay migraciones. No hay nada que aplicar ni que revertir. Para volver atrás alcanza con revertir el commit.

## Dependencias

`three@0.180.0`, `@react-three/fiber@9.4.0`, `@react-three/drei@10.7.6` y `@types/three@0.180.0`, fijadas. La escena es un chunk aparte (unos 239 KB gz) que solo se descarga en escritorio con WebGL.
