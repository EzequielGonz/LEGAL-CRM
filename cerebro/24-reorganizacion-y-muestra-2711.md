# 24 · Reorganización del panel y muestra de diseño (27/11)

Propuesta de Claude después de recorrer el panel publicado como dueño, pantalla por pantalla, las cuatro cuentas (148 pantallas, más una segunda pasada abriendo formularios y paneles, sin enviar ni guardar nada). **Estado: la parte de diseño fue RECHAZADA por el dueño el mismo 27/11** («no así claramente no… es dejarlo tal cual está ahora pero mejorarlo un poco, no así de drástico el cambio; las animaciones y demás del cerebro me encantan pero no es funcional»). Las secciones 3 y 4 quedan como registro de lo que no va. Los hallazgos de la sección 1 siguen valiendo y entran al plan `22-plan-panel-2711.md`. No hay código cambiado.

Pedido del dueño: «entrar al panel como dueño y mirar y usar sección por sección, perfil por perfil, y proponeme una reorganización, orden, mejor flujo de trabajo» y «esos colores re contra infantiles y de colegio… todo es pura decoración y se repite casi todo, el trabajo cotidiano es muy difícil de esta manera». Muestra: «no hace falta muestra navegable, fotos está bien».

## 1. Qué encontré (comprobado en el recorrido)

**Se repite.**
- El embudo de la semana aparece en seis lugares: tarjeta del perfil, Resumen de todo, Hoy (dos veces: «cajitas» y «paso a paso»), Resultados, Historial y Contactos.
- En Chats → Activos la misma cifra sale tres veces en una pantalla (caja grande, pastilla y título de la lista).
- Hay nueve listas de las mismas personas: Activos, Todos los chats, Descartados, Movidos en la limpieza, Lista (oportunidades), Etapas, Por base, Buscar en la base y Seguimiento. Dos entradas del menú llevan a la misma pantalla (`/conversaciones` desde Chats y desde «Captados»; `/oportunidades` desde Chats y desde Contactos).
- El bot se configura en tres pantallas con los mismos bloques (probar, ficha del negocio, roles): Bot IA, Biblioteca de agentes y Laboratorio.
- Hay cinco lugares para pedir algo: Jarvis (panel lateral), la pantalla «Jarvis» que por dentro es el asistente viejo, la barra del Cerebro, «Nueva tarea» de la Oficina y la Bandeja para Claude.

**Se contradice.** El mismo día, en Jurídico: «5 personas te esperan» (Hoy), «15 piden una persona» (tarjeta del perfil y Resumen), «15 de 63 charlas» (panel de Jarvis), «25 escribieron en 24 h» (tarjeta). Captados de la semana: 4 en Hoy y Resultados, 6 en Jarvis, 8 en Resumen. Mensajes: 318 y 454. Campañas dice «2 enviando ahora» y una es un borrador. Hoy marca «campaña con fallas, 78 no salieron» cuando en la base los 205 están pendientes sin error porque todavía no era horario de envío.

**Decora.** Hoy abre con un saludo ilustrado, una tarjeta con esferas y cuatro cajas pastel; la única lista con botones («Para decidir») queda abajo de todo. Dos carteles fijos ocupan 140 px arriba de todas las pantallas. El Cerebro es un carrusel 3D de tarjetas con texto girado. La Oficina es un edificio 3D con 43 agentes «libres» y un canal que dice «voy por un café». Ninguno resuelve una tarea.

**Tarda.** Hoy tarda entre 11 y 14 segundos en frío en los cuatro perfiles; Bandeja y Biblioteca de agentes 12; en Coberturas, Bases 16 y Lista 13.

**Falta para trabajar.** En el chat no hay forma de reabrir con plantilla a una persona puntual. La ficha no muestra las columnas del Excel. Desde la lista de contactos no se puede actuar sin entrar a otra pantalla.

## 2. Reorganización propuesta

Regla: cada cifra vive en un solo lugar y es un botón; cada pantalla empieza por lo que hay que hacer; lo que no se puede tocar para resolver algo, se va (se archiva, no se borra).

**Dentro de cada perfil: cuatro secciones y Configuración** (hoy son cinco más un «Más» con seis grupos y 31 pestañas).

| Sección nueva | Reemplaza a | Qué es |
|---|---|---|
| **Bandeja** | Hoy, Chats → Activos, Incidencias, «Captados» | La cola de trabajo en tres columnas: lista, chat y ficha. Pestañas con las tareas reales: Responder, Derivar, Revisar, Todos. La que más espera va primero y al resolver pasa sola a la siguiente. El chat trae «Reabrir con plantilla» cuando pasaron 24 h. La ficha muestra los datos del Excel. |
| **Campañas** | Campañas, Bases, Plantillas de Meta y de Wasender, Seguimiento | El camino de salida completo: base → plantilla y línea (elegida a mano) → horario y tope → «Dejar lista». La lanza el dueño. El recontacto automático es una campaña más. |
| **Contactos** | Etapas, Por base, Buscar en la base, Lista, Todos los chats, Descartados, Movidos en la limpieza, Citas | Una sola tabla. La etapa es el filtro (con su cifra). Lo demás son vistas guardadas: captados sin derivar, piden una persona, caídos para reabrir, no contactar. Cada fila tiene su acción. |
| **Resultados** | Resultados, Historial | El embudo una sola vez, con período, día por día y de dónde vino cada persona. |
| **Configuración** | Bot IA, Biblioteca y Comparar agentes, Laboratorio (del perfil), Líneas de Meta y Wasender, Redes, Ajustes, Salud | Lo que se toca de vez en cuando. Salud deja de ser una sección: lo que frena aparece en la línea de estado de arriba con su botón de arreglo. |

**Fuera de los perfiles: Inicio, Jarvis, Cerebro y Oficina.**
- **Inicio** junta Perfiles y Resumen de todo: una fila por perfil con Responder, Derivar, Revisar, la campaña y la semana; debajo, «Frena el trabajo» y «Espera tu OK», cada cosa con su botón.
- **Jarvis** es el único lugar para pedir: mismo motor adentro y afuera de un perfil, acepta Excel, propone reabrir charlas con plantilla y siempre pregunta antes. Se retira el «asistente general» y sus textos («Pedile algo»).
- **Cerebro** pasa a ser una página simple: qué sabe, qué aprendió, decisiones y pendientes de los dueños, cada uno accionable. Preguntar, enseñar y ordenar se hacen con Jarvis.
- **Oficina** pasa a ser la lista de tareas de los agentes con su estado (en cola, trabajando, espera tu OK, hecha por Gemini sin repasar), con la Bandeja para Claude adentro. El selector de alcance suma «Los 4 rubros» y «Todo el panel».
- El Laboratorio de bots global se reparte en la Configuración de cada perfil, para no mezclar rubros.

**El día de trabajo, en cuatro pasos.** 1) Inicio dice cuánto hay en cada perfil. 2) «Responder» abre la Bandeja con esa cola; se contesta y pasa a la siguiente. 3) «Derivar» pasa cada captado al profesional con los datos de la ficha completos. 4) Campañas: se deja lista la del día y se mira el avance. Resultados y Configuración quedan para cuando hace falta.

## 3. Colores, tipografía y movimiento

Lo que se lee como «app de colegio»: las cajas pastel (lavanda, rosa, crema, menta), las esferas magenta, amarilla y violeta, el sol con montañas, y cuatro tipografías a la vez (Inter Tight apretada, una palabra en cursiva con recuadro en cada título, rótulos en letra de máquina y Playfair).

Propuesta «grafito y latón»:
- Un fondo grafito, superficies pizarra, texto marfil.
- Un solo acento, latón apagado, reservado para la acción principal de cada pantalla.
- Tres estados poco saturados: salvia (anda bien), arcilla (frena), niebla (informa).
- Cada perfil conserva su tono, apagado, solo en el logo y una línea fina (sin cabeceras con degradé).
- Modo claro equivalente (marfil y tinta) con el mismo acento más oscuro.
- Dos familias: Geist para todo y Newsreader solo para el título de la pantalla y las cifras grandes.
- Movimiento: transiciones de 150 a 250 ms en el trabajo; una sola pieza 3D sobria en la entrada y en Perfiles, en lugar de la lámpara.

La entrada 3D no está en esta muestra: se arma aparte cuando el dueño apruebe la dirección.

## 4. La muestra

Siete imágenes enviadas al dueño el 27/11: paleta y tipografía (antes y propuesta), Inicio, Bandeja, Contactos, Campañas, Resultados y Bandeja en modo claro. Los nombres y el detalle son de ejemplo; las cifras de cabecera salen del panel del 27/11.

Fuentes para regenerarlas: `cerebro/biblioteca/muestra-2711/` (`node render.js <carpeta>` con Playwright; salen los PNG al lado).

## 5. Qué falta decidir

1. Si la dirección de color y tipografía va, o qué cambia.
2. Si el orden de cuatro secciones va, y si algo de «Configuración» tiene que quedar más a mano.
3. Con el OK, esto entra como primera tanda del plan `22-plan-panel-2711.md`.

## 6. Cómo se hizo

Recorrido propio con Playwright sobre producción en solo lectura (el único pedido que no fue de lectura es el ingreso). No se le preguntó nada a Jarvis, al Cerebro ni al bot en producción: quedó frenado por seguridad y esas tres pruebas están cubiertas por la lectura del código. Datos de la campaña comprobados en la base con consultas de agregados. Capturas con datos de personas: solo en la carpeta temporal, no en el repositorio.
