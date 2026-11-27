# Auditoría del panel · 27/11

Pedido del dueño en la Oficina: «analiza el panel completo, busca fallas, bugs, errores de diseño, de código, de carga, de funcionamiento, accesibilidad; usalo como si fuese tuyo».

Cuatro agentes con acceso al código (fallas de código, carga, accesibilidad y uso diario) y Dirección. Todo se comprobó leyendo el código; nada se midió en un navegador ni se probó en ejecución. Total: 54 fallas nuevas (11 de código, 12 de carga, 11 de accesibilidad y 20 de uso diario), sin repetir el análisis de la mañana (`cerebro/biblioteca/analisis-2026-11-27/`).

## Aplicado y publicado el 27/11 (commits `e62efd8`, `cce6664`, `feb5d4f`)

**Fallas de código**
- El bot ofrecía turnos en hora del servidor: «9 a 13» salía 6 a 10 de Argentina. Ahora calcula en hora argentina (`src/lib/agenda.ts`).
- Cancelar una extracción paga no la frenaba; el tope diario no contaba lo ya pagado en las canceladas (`src/lib/marketing/extraer.ts`).
- Citas: no se cancela una realizada, los cambios de estado se validan y quedan en el historial.
- Prospección automática: ya no responde «ok» si falló ni reactiva una archivada.
- Oficina: «Para tu OK» ya no lista lo de Gemini sin repasar; «Arrancar» usa Gemini también desde el Cerebro; máximo 20 respuestas por corrida con el gasto registrado por partes; las entregas viejas no desaparecen de la lista; pedir cambios limpia los datos viejos.

**Uso diario**
- «Pausar campaña» solo dice «pausada» si el servidor confirmó; «Lanzar» no queda trabado. Botón «Cancelar» en la confirmación.
- Errores de red en castellano en campañas, bases y perfiles (`src/lib/errores-ui.ts`).
- Derivar: «Enviado» solo cuando se guardó; antes se marcaba al abrir WhatsApp.
- Lista de campañas vacía por filtro, con explicación.

**Accesibilidad**
- Botón «Enviar a WhatsApp» legible (contraste de 1,98 a 7,6).
- Botón de copiar con nombre y aviso; errores que se anuncian a lectores de pantalla.
- Tarjetas laterales del anillo del Cerebro más legibles, sin tocar la animación.
- Pestañas de tareas de la Oficina con teclado; barras de avance visibles en modo claro.

**Velocidad**
- Salud muestra el marco al instante en vez de quedar en blanco.
- Hoy ya no calcula en cada carga una estadística que casi nunca muestra.
- La validación de sesión tiene tope de 3 segundos.
- El refresco de la Oficina usa el gasto de Gemini con caché.

## Pendiente (va con las tandas del plan, para no pisarlas)

- **Chats y ficha:** apagar o prender el bot sin comprobar la respuesta; lista vacía cuando en realidad falló la lectura; Enter manda el mensaje sin protección; el mismo estado con cinco nombres; valores internos sin traducir.
- **Hoy:** título de tarjeta que no coincide con lo que lista; 9 conteos por campaña y se usan 2; «captados sin derivar» contado 4 veces; 8 cifras pedidas y 4 usadas; el cartel «Campaña con fallas» sigue sumando todo el perfil.
- **Chats, carga:** tres vueltas seguidas que pueden ir juntas.
- **Cerebro:** salud en vivo sin caché y 200 filas para mostrar un número; botón «Pausar movimiento».
- **Perfiles:** unas 50 consultas cada 20 segundos por pestaña abierta.
- **Meta:** la memoria del estado de las líneas no sirve entre arranques.
- **Resultados:** hasta 3000 filas para un resumen; enlaces de período que no cambian nada.
- **Plantillas y contactos:** textos de Meta sin traducir; rótulos distintos para la misma acción.
- **Tablas:** encabezados sin alcance en 54 de 69 columnas.
- **Contrastes ya conocidos** de la auditoría de la mañana (grises del Cerebro y de la Oficina, dorado en modo claro).

## Sin confirmar

- La causa de los 12 segundos de Hoy y Salud en Autos 0 km y Coberturas: puede ser la campaña en curso o Meta. Hay que medir con los registros de Vercel.
- El foco de teclado del índice del Cerebro: el informe lo daba por invisible, pero otra regla del mismo archivo ya le pone contorno. Falta verlo en el navegador.

## Sobre el informe de Gemini

La «Auditoría integral» que hizo Gemini no estaba comprobada: Gemini no ve el código. De sus puntos, coinciden con fallas reales el contraste bajo en textos secundarios y la falta de aviso de «guardado» o error en acciones. No se confirmaron los botones «Eliminar» ni los filtros que quedan pegados entre rubros.
