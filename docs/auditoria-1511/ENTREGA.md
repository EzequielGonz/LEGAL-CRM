# Auditoría del 15/11: qué incluye

Pedido de la responsable: auditoría exhaustiva del panel y de los bots, y aplicar los cuatro bloques sin frenar. Decisiones tomadas por ella en `docs/ESTADO.md` (15/11).

## Bloque 1: bots

- **Crisis:** si la persona habla de quitarse la vida o de hacerse daño, el bot le manda las líneas de ayuda (135 en CABA y GBA; 0800 345 1435 y (011) 5275-1135 en todo el país; 911), deja de responder en ese chat, abre una incidencia «crisis» y avisa al teléfono. Arriba de cada pantalla del perfil aparece un cartel rojo de urgencia mientras la incidencia siga abierta. `src/lib/agentes/crisis-y-enojo.ts`, `src/lib/atencion/crisis.ts` y `src/components/perfiles/cartel-crisis.tsx`.
- **Enojo con nosotros:** disculpa breve y corte. Ante una amenaza o denuncia, lo mismo y, además, se avisa (incidencia). El enojo con otros (la ART, el jefe) no cuenta.
- **Contestadores y bots:** se reconocen más (bienvenidas con menú, «asistente virtual», números fuera de uso) y en inglés y portugués. Una persona que contesta corto y rápido («sí», «dale») ya no se toma por un bot.
- **Precios:** el validador frena «40 lucas», «35k», cifras en palabras, «rondan los 50 mil» y promesas («muchas chances de cobrar»). La guía común dice que el precio lo define el equipo.
- **Captar solo con aceptación real:** si el último mensaje es un rechazo o una pregunta sin ningún «sí», no se capta.
- **Fechas en el historial:** si la persona vuelve a escribir después de más de un día, el bot lo ve («[Escribió el 13/11, 3 días después]»).
- **Falla de la IA:** cada llamada tiene 20 segundos y un reintento; el rescate vuelve a probar una vez; si falla otra vez, el chat pasa a una persona.
- **Probar el bot real** corre lo mismo que el bot en vivo: la capa fija (crisis, enojo, amenaza, contestadores), la llave de aceptación, el cierre del rubro y el validador.
- **Reglas estrictas** también con una asignación de la biblioteca.
- **Plantillas de Marketing:** 56 variantes preguntaban «¿Les interesa revisarlo?» sin decir qué; ahora la pregunta tiene contexto.

## Bloque 2: seguridad

- **Código de ingreso de 8 números.** El de 6 sigue sirviendo para entrar hasta que se cambie, y mientras tanto el panel muestra un aviso para cambiarlo.
- **Intentos atómicos:** se reservan antes de comprobar el código. 5 por dispositivo o red, y 30 fallidos en total, pausan 15 minutos.
- **Sesión:** vence a los 7 días sin uso y, aunque se use, a los 30 días del ingreso.
- **Agenda:** el bot solo agenda un horario libre y futuro de los que dio la agenda.
- **Errores:** un error de la base ya no se muestra tal cual en el panel; queda en el registro del servidor.

## Bloque 3: panel

- **Velocidad:** cifras de «Perfiles», «Salud» y «Prospectos por base» en una sola consulta, con índices (0619), un solo refresco en Perfiles y el chat con menos datos.
- **Accesibilidad y diseño:** menú del celular y asistente como diálogos (foco, Escape, fondo inerte), etiquetas en los campos, avisos leídos por el lector de pantalla, páginas de error y «no encontrado», áreas táctiles de 44 px, anillo de foco visible, contraste, letra mínima de 12 px y confirmaciones propias en lugar de las del navegador.

## Bloque 4: negocio

- **Modo entrenamiento de campañas:** al crear una campaña, un botón deja 20 envíos por día durante 7 días con ritmo prudente. El límite y el ritmo se siguen eligiendo a mano: un límite mayor apaga el entrenamiento. Al día 7 la ficha de la campaña pide el resultado (avanzó / no avanzó / vendido). Nada se sube solo.
- **Tope por persona:** como mucho 3 mensajes automáticos sin respuesta, sumando campañas, segundo intento, seguimiento y recuperación.
- **Hoy:** los captados que esperan el llamado hace más de 24 horas se marcan, con un aviso arriba.
- **Freno por respuesta:** con 100 envíos o más en 7 días y menos del 1 % de respuestas, la campaña se frena. Si se reanuda a mano, ese freno no la vuelve a parar en 7 días.
- **Línea caída:** aviso al teléfono cuando una línea que andaba se desconecta.

Migraciones: `MIGRACIONES.md`. Qué se probó y qué no: `INFORME.md`.
