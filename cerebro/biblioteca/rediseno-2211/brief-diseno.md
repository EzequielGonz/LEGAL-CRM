# Brief de diseño: panel CRM multirubro (versión simple)

Fecha: 22/11/2026. Fuente: A1 Gallery (9 consultas). Mobbin no se pudo usar: pide plan pago y no se contrata nada sin autorización.

**Rumbo (ajustado por el dueño):** fácil y sencillo. Cada pantalla tiene un objetivo, pocas tarjetas grandes y lo secundario va detrás de «Ver más». Las estadísticas van en anillos con el número grande al centro. Las animaciones son simples: aparecer suave, llenar el anillo y contar la cifra. Modo oscuro con vidrio sobrio, sin efectos recargados.

---

## 0. Qué tan firme es la evidencia

- Las normas numéricas salen de dos agregados de A1. El primero son las secciones *features* de sitios de software: **409 secciones**. El segundo son las secciones *stats* de todos los rubros: **163 secciones**. Las dos muestras alcanzan para sacar conclusiones y ninguna vino marcada `lowSample`.
- **Límite importante:** A1 guarda sitios de marketing (landings), no pantallas de aplicaciones logueadas. Por eso los tamaños de título y los paddings están pensados para landings, y abajo los bajo a escala de panel. Los colores, los radios, la proporción de efectos y las tipografías sí se trasladan bien.
- Los dashboards que pidió el dueño (Stripe, Vercel, Pipedrive, HubSpot, Close, Superhuman, Arc) **no están en A1** como app. Los cito como referencia conocida y **sin tokens medidos**. Attio y Folk sí están en A1, pero como landings claras: sirven para copiar la simpleza, no la paleta.
- No encontré en A1 ningún dashboard con anillos radiales como patrón medido. El único caso es el donut del hero de Basedash. Las medidas del componente anillo (sección 5) son una **propuesta de diseño**, no una norma medida.

## 1. Números de referencia (p25–p75, mediana entre paréntesis)

| Medida | Features software (409) | Stats (163) |
|---|---|---|
| Título px | 36–48 (47) | 48–80 (59) |
| Cuerpo px | 15–18 (16) | 16–20 (16) |
| Relación título:cuerpo | 2,25–3,2 (2,67) | 2,42–4,69 (3,5) |
| Padding de sección px | 48–120 (88) | 40–120 (94) |
| Ancho del contenedor px | 1100–1308 (1240) | 1133–1308 (1272) |
| Radio px | 8–16 (12) | 8–24 (11,5) |
| Usan borde | 48 % | 29 % |
| Usan sombra | 21 % | 7 % |
| Usan degradé | 18 % | 13 % |
| **Usan blur de fondo (vidrio)** | **6 %** | **4 %** |

Lectura: el diseño premium real se apoya en **bordes finos**, no en sombras ni en vidrio. El vidrio aparece en 1 de cada 20 secciones. Para eso hay que reservarlo: va en la barra lateral, en la tarjeta de Jarvis y en los modales, y en ningún otro lado. Las cifras grandes de stats tienen el doble de proporción que los títulos comunes (mediana 3,5×). Eso confirma la idea de un número grande sobre una etiqueta chica.

Tipografías de títulos más frecuentes en software: Inter (31), **Geist (12)**, Plus Jakarta Sans (10), Switzer (10).

## 2. Referencias (con URL y por qué sirven)

**Medidas en A1 (con tokens reales):**
1. **Polar**: https://polar.sh. Su sección «Know your unit economics» es un dashboard oscuro con 4 a 5 tarjetas grandes y una cifra por tarjeta. Fondo `#090909`, texto secundario `#808189`, radio 12, borde fino. Es el modelo de «pocas tarjetas grandes».
2. **Basedash**: https://www.basedash.com. El hero muestra un **donut grande con el número al centro** sobre negro `#000000`, con radio 15 y blur de fondo. Es la referencia directa del componente anillo.
3. **Taskco** (A1: https://www.a1.gallery/website/taskco). Fondo `#080808`, radio 40, blur y borde. Tiene una tarjeta de asistente que dice «Good Morning!» con acciones en chips. Es la base del saludo de Jarvis.
4. **Reflag/Bucket** (A1: https://www.a1.gallery/website/bucket). La UI de producto oscura y sobria es la mejor referencia para la barra lateral: fondo `#09090b`, superficie `#101114`, texto secundario `#8f92a3`, radio 8, Geist Mono 14 con Overused Grotesk 44/600.
5. **Primora** (A1: https://www.a1.gallery/website/primora). Bloque de stats oscuro con cifras grandes: fondo `#100e11`, superficie `#2b282d`, texto `#b6b2b8`, radio 8, gap 78. Muestra cuánto aire necesita una cifra.
6. **Paraform**: https://www.paraform.com. Bento oscuro de 4 tarjetas: fondo `#1a1a1a`, radio 10, gap 20, bureauSans 22/16.
7. **Metaview**: https://www.metaview.ai. Superficie verde muy oscura `#0b1b15` con texto `#e3ffef`, radio 16. Prueba que un fondo «casi negro con tinte» se ve más premium que el gris neutro.
8. **Factory**: https://factory.ai. Interfaz de agentes de IA con sesiones en lista. Usa Geist 36 y Geist Mono 18, sobre `#020202` con texto `#eeeeee`. Sirve para «Oficina» de agentes y para Chats.
9. **Linear for Startups**: https://linear.app/startups. Oscuro, con glow medido y líneas finas. Es la referencia de sobriedad.
10. **Resend**: https://resend.com. Oscuro con un único acento y glow puntual. Muestra cómo usar 1 brillo por pantalla, no 10.
11. **Attio**: https://attio.com y **Folk**: https://www.folk.app. Son CRMs simples. De ellos se copia la jerarquía (una lista y una acción) y el texto llano, no los colores (son claros).

**Conocidas, sin medir en A1** (verificar en vivo antes de copiar valores): Stripe Dashboard (inicio con 1 gráfico y pocas cifras), Vercel Dashboard (barra lateral mínima, estados con punto de color), Linear app (barra lateral, atajos, foco visible), Superhuman (una tarea por pantalla), Pipedrive y HubSpot nuevo (inicio «tus tareas de hoy»), Close (lista de llamadas del día).

## 3. Tokens para construir

### Paleta oscura (contraste calculado con WCAG 2.1)

| Rol | Valor | Contraste |
|---|---|---|
| Fondo app | `#0B0D12` (casi negro con tinte azul) | n/a |
| Superficie vidrio 1 (tarjetas) | `rgba(255,255,255,0.04)` ≈ `#15171B` + `backdrop-filter: blur(16px) saturate(140%)` | n/a |
| Superficie vidrio 2 (hover, modales) | `rgba(255,255,255,0.07)` ≈ `#1C1E23` | n/a |
| Borde | `rgba(255,255,255,0.08)`; en hover y foco `0.14` | decorativo |
| Brillo de borde superior (relieve) | `inset 0 1px 0 rgba(255,255,255,0.06)` | decorativo |
| Texto primario | `#F2F3F5` | 17,5 / 16,2 / 15,0 ✓ AAA |
| Texto secundario | `#A4A9B6` | 8,3 / 7,6 / 7,1 ✓ AAA |
| Texto terciario (fechas, ayudas) | `#7D8290` | 5,1 / 4,7 / **4,3 sobre vidrio 2** → usar solo sobre fondo o vidrio 1, o subir a `#868B99` |
| Éxito | `#4ADE80` | 11,2 ✓ |
| Error | `#F87171` | 7,0 ✓ |
| Pista del anillo | `rgba(255,255,255,0.08)` | decorativo |

**Acentos por rubro.** Los cuatro tienen luminosidad pareja, para que ninguno grite más que otro. Todos superan 6,5:1 sobre cualquier superficie y sirven para texto, arco del anillo y foco.

| Rubro | Acento | Contraste sobre fondo |
|---|---|---|
| Jurídico | `#8B9CFF` índigo | 7,7 |
| Coberturas médicas | `#4FD1C5` turquesa | 10,4 |
| Autos 0 km | `#F5B544` ámbar | 10,7 |
| Marketing | `#F47FBF` rosa | 8,0 |

El texto sobre un botón de acento va en `#0B0D12` (7,7:1 o más). Cada rubro usa **solo su acento** dentro de su pantalla. Los cuatro juntos aparecen únicamente en «Hoy», un anillo cada uno.

**Fondo vivo (sobrio):** 2 manchas radiales difusas en lugar de un mesh de colores. La primera es `radial-gradient(600px at 15% 0%, rgba(139,156,255,0.10), transparent)`. La segunda es `radial-gradient(500px at 90% 30%, rgba(79,209,197,0.06), transparent)`. Se mueven 20 a 40 px en 30 s, de ida y vuelta, y quedan **quietas con `prefers-reduced-motion`**.

### Tipografía (Google Fonts)
- **Geist** para toda la UI, en pesos 400, 500 y 600. Es la segunda tipografía de título más usada en software en A1 (12 sitios) y tiene menos cara de plantilla que Inter.
- **Geist Mono** para cifras chicas, horarios y códigos. Las cifras de los anillos van en Geist 600 con `font-variant-numeric: tabular-nums`.
- Opcional, una sola vez por pantalla: **Instrument Serif** itálica para el saludo de Jarvis («Buen día, Ana»). Da calidez y evita el look genérico.
- Escala del panel (bajada desde la norma de landings): 12 / 14 / **16 cuerpo** / 20 / 24 título de tarjeta / 32 título de pantalla / 48 a 56 cifra del anillo grande. El interlineado es 1,5 en el cuerpo y 1,1 en títulos y cifras. El tracking es −0,02em de 24 px para arriba.

### Radios, espaciado, sombras
- Radios: 8 en chips y botones chicos, **16 en tarjetas** (dentro del p75 medido), 24 en la tarjeta de Jarvis, 999 en pastillas.
- Espaciado con base 4: 4, 8, 12, 16, 24, 32, 48. Padding de tarjeta 24 (32 en la de Jarvis). Gap del bento 16 a 20 (Paraform mide 20). Margen de página 32 en escritorio y 16 en celular. Contenido hasta 1240 px (mediana medida).
- Sombra: una sola elevación, `0 8px 32px rgba(0,0,0,0.35)`, y solo en hover y en modales. El relieve sale del borde y del brillo `inset`, no de sombras apiladas.
- Blur: 16 px en tarjetas de vidrio y 24 px en barra lateral y modales. Fallback sin `backdrop-filter`: `#15171B` sólido.

### Movimiento
| Uso | Duración | Easing |
|---|---|---|
| Hover y foco | 150 ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Aparecer tarjeta (opacidad 0→1, y 8→0 px) | 300 ms, escalonado 60 ms y como mucho 4 tarjetas | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Llenado de anillo | 900 ms | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out expo) |
| Conteo de cifra | 900 ms, en sincronía con el anillo | mismo easing |
| Cambio de pantalla | 200 ms fundido | ease-out |

**No va:** inclinación 3D de tarjetas, partículas, parallax ni brillos que sigan al mouse. El pedido nuevo dice «animaciones simples». Con `prefers-reduced-motion: reduce` no hay ninguna animación: el anillo y la cifra aparecen en su valor final.

## 4. Pantalla «Hoy» en 3 bloques

Objetivo de la pantalla: **«Saber qué pasó y qué tengo que decidir»**.

```
┌ barra lateral ┐┌──────────────────────────────────────────────┐
│               ││ 1. JARVIS (vidrio, ancho completo)            │
│  Hoy  •       ││ «Buen día, Ana.» (serif itálica 32)           │
│  Chats        ││ 2 frases: qué pasó desde ayer.                │
│  Campañas     ││ [Decidir 2 cosas]  [Ver resumen]              │
│  Perfiles     │├──────────────────────────────────────────────┤
│  ───          ││ 2. CUATRO ANILLOS (uno por rubro, en fila)    │
│  Salud        ││  ◯ 12      ◯ 8       ◯ 5       ◯ 21           │
│  Cerebro      ││  Jurídico  Cobert.   Autos     Marketing      │
│               ││  consultas nuevas hoy / meta del día          │
│  (usuario)    │├──────────────────────────────────────────────┤
│               ││ 3. PARA DECIDIR (máx. 3 filas)                │
│               ││  • Responder a 3 chats esperando +2 h  [Ir]   │
│               ││  • Aprobar campaña Autos               [Ver]  │
│               ││  Ver más ▾                                    │
└───────────────┘└──────────────────────────────────────────────┘
```

- **Bloque 1, Jarvis.** Una tarjeta de vidrio de radio 24 y padding 32. Tiene un punto «vivo» de 8 px en el acento índigo que respira (escala 1 a 1,15 en 2 s, se apaga con movimiento reducido). El texto sale en 2 frases cortas, sin jerga: «Entraron 46 consultas. 3 personas esperan respuesta hace más de 2 horas.» Lleva como máximo 2 botones. El texto aparece completo, sin efecto de máquina de escribir: se lee mejor y es más accesible.
- **Bloque 2, anillos.** Son 4 tarjetas iguales en grilla de 4 columnas (2×2 en tablet y 1×4 deslizable en celular). Cada una lleva un anillo, una etiqueta y una línea de contexto («+4 vs. ayer»). Tocar la tarjeta abre ese rubro. Esto mantiene la separación: el rubro se abre en su espacio.
- **Bloque 3, para decidir.** Una lista de 3 ítems como máximo, cada uno con verbo y botón. Lo demás va detrás de «Ver más». Si no hay nada que decidir, aparece un estado vacío amable: «Todo al día ✓».
- Nada más en la pantalla. Los gráficos de tendencia, las métricas de campañas y la salud van a sus pantallas propias.

## 5. Componente anillo (radial progress)

| Propiedad | Grande («Hoy») | Chico (listas, Salud) |
|---|---|---|
| Diámetro | **160 px** (120 en celular) | 64 px |
| Grosor del trazo | **12 px** | 6 px |
| Pista | `rgba(255,255,255,0.08)`, mismo grosor | igual |
| Arco | acento del rubro, `stroke-linecap: round` | igual |
| Inicio | arriba (−90°), sentido horario | igual |
| Número al centro | Geist 600, **48 px**, `tabular-nums`, `#F2F3F5`, tracking −0,02em | Geist 600 16 px |
| Unidad o meta bajo el número | Geist 400 13 px `#A4A9B6` («de 20») | (sin texto) |
| Etiqueta debajo del anillo | Geist 500 16 px `#F2F3F5` | n/a |
| Animación | llenado 0→valor en 900 ms + conteo en sincronía, `cubic-bezier(0.16,1,0.3,1)`, una sola vez al entrar en pantalla | 600 ms |
| Brillo opcional | `filter: drop-shadow(0 0 8px <acento>40)` solo en el arco y solo en el anillo grande | ninguno |

Implementación: SVG con 2 `<circle>` (`r = (D − trazo)/2`, `stroke-dasharray = 2πr`), animando `stroke-dashoffset`. La accesibilidad pide tres cosas. Primero, `role="img"` con `aria-label="Jurídico: 12 de 20 consultas hoy"`. Segundo, la cifra como texto real, no dibujada. Tercero, que el arco nunca sea el único portador del dato, porque el número está siempre visible. Si el valor pasa la meta, el arco se cierra y aparece un ✓ chico, sin cambiar de color.

## 6. Barra lateral y tarjetas

**Barra lateral** (patrón Reflag, Vercel y Linear):
- Ancho 240 px y 72 px colapsada (solo íconos con tooltip). Es vidrio con blur 24 y borde derecho `rgba(255,255,255,0.08)`.
- Lleva **6 entradas como máximo**, ícono de 20 px más texto de 14 px/500: Hoy, Chats, Campañas, Perfiles, una línea divisoria, Salud y Cerebro.
- El ítem activo lleva fondo `rgba(255,255,255,0.06)`, radio 8 y una barrita de 2 px a la izquierda en el acento. Si hay pendientes, un contador en pastilla.
- El selector de rubro va arriba como pastilla con el color del rubro. Cambiar de rubro cambia todo el espacio de trabajo.
- Foco visible: `outline: 2px solid #8B9CFF; outline-offset: 2px` en todo elemento interactivo.

**Tarjetas (bento sobrio):**
- Grilla de 12 columnas y gap 16. Cada pantalla lleva **de 3 a 5 tarjetas**. Una es la protagonista (8 columnas) y las demás de apoyo (4 columnas).
- Cada tarjeta tiene un título de 16/500, un dato o acción principal y como mucho un enlace «Ver más».
- Al pasar el mouse, el borde sube de 0,08 a 0,14 y la tarjeta sube 2 px en 150 ms. No se inclina.

**Otras pantallas (un objetivo cada una):**
- Chats: «Responder». Lista y conversación, con el filtro por rubro escondido.
- Campañas: «Ver si funcionan». Un anillo de respuesta por campaña y el botón «Dejar lista».
- Perfiles: «Revisar redes». Una tarjeta por perfil, de solo lectura en bio y botón.
- Salud: «¿Anda todo?». Un anillo grande con el % de servicios OK y una lista de semáforos detrás de «Ver más».
- Cerebro: «Qué sabe el negocio». Buscador grande. La «Oficina» de agentes va en una tarjeta con figuras planas y un punto de estado que respira, no en una escena 3D.

## 7. Qué evitar (lo que lo vuelve genérico o «hecho por IA»)

- Degradé violeta→azul en todo, mesh de muchos colores, glow en cada tarjeta. Los datos dicen que solo 4 a 6 % de las secciones usan blur: el vidrio en todos lados abarata.
- Más de 5 tarjetas por pantalla, KPIs en fila de 8, gráficos que nadie pidió.
- Tarjetas que se inclinan, partículas, cursores con estela, textos con efecto de máquina de escribir.
- Gris neutro puro `#121212` o `#1e1e1e` con Inter por defecto. Conviene un negro con tinte (`#0B0D12`) y Geist.
- Íconos de colores distintos para cada cosa. Todos van en `#A4A9B6` y solo el activo lleva acento.
- Jerga en la UI («leads», «pipeline», «KPI»). En su lugar, «consultas», «para decidir», «anda bien».
- Texto gris clarito sobre vidrio con contraste menor a 4,5:1 (ver la nota de `#7D8290`).
- Emojis como íconos y avatares 3D genéricos de IA para Jarvis. Para Jarvis va un orbe o punto simple.
- Números animados que vuelven a contar en cada visita o cada pocos segundos: se cuenta una sola vez al cargar.
