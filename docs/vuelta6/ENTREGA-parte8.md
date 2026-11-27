# Vuelta 6 · parte 8: el panel premium y animado (rama `rediseno5/parte8`)

Pedido del dueño (22/11): «los componentes, las animaciones y los carteles» que marcó del video Df93dArgY10, **sin el fondo de manchas**, en todo el panel.

## Qué incluye
- `src/app/vivo.css` (va última) y `src/components/vivo/`: bento de colores (`BentoColor`, `CeldaColor`, `BarrasMini`), vidrio sobre círculos (`VidrioCirculos`), botones neumórficos (`BotonNeu`), tarjeta gradient mesh (`TarjetaMesh`), parallax en capas (`Paralaje`), carteles (`Cartel`, `Cita`, `PildoraAmarilla`) y entrada entre pantallas (`EntradaContenido`).
- Reglas puras en `src/lib/premium/cartel.ts` con pruebas en `tests/unitarias/vivo-vuelta6.test.ts`.
- Ingreso: escena parallax con el logo que se dibuja, título cartel, campos escalonados, brillo en el botón y salida animada al entrar.
- Perfiles: cartel «¿Con qué [perfil] trabajás?», píldora amarilla, tarjeta de marca con gradient mesh por rubro, inclinación 3D con luz que sigue al mouse y entrada escalonada.
- Hoy: cabecera parallax con el saludo, vidrio sobre círculos («Para decidir hoy»), placa de botones neumórficos (Chats, Contactos, Citas, Seguimiento) y bento de colores con las cifras reales de la semana (números que cuentan, anillo de derivados, barras de la semana).
- Resumen: bento de colores (pendiente total con barras por perfil y semana contra la anterior).
- Chats: bento de colores arriba, burbujas con identidad que entran, separador de día en píldora, filas que entran, cabecera de vidrio.
- Resultados: embudo en cajas de color. «Más»: íconos de color y entrada escalonada. Títulos de pantalla como cartel o con raya animada. Tablas con encabezado fijo de vidrio y filas que entran. Esqueletos con barrido. Avisos que entran.
- Todo con transform/opacity; `prefers-reduced-motion` apaga todo. Fuente nueva: Instrument Serif (Google Fonts, gratis, autoalojada por Next).

## Qué no toca
`/oficina`, `/cerebro` y Jarvis (otros agentes). No hay migraciones ni cambios de datos.
