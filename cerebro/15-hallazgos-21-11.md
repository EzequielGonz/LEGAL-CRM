---
description: Cruce del 21/11 de los informes H (panel como usuario, 86 chats), I (agentes, roles, Marketing, líneas), J (lógica en el código), K (relectura total) y L (sesiones de redes). Qué estaba mal en el cerebro, qué no sabía, riesgos como propuestas y preguntas que el panel no responde.
actualizado: 2026-11-21
---

# Hallazgos del 21/11 (solo lectura, nada aplicado)

Informes completos, sin datos personales: `biblioteca/analisis-2026-11-21/`. Todo lo que dice «propuesta» necesita autorización de los dueños antes de tocar producción.

## 1. Lo que el cerebro tenía mal (corregido acá; manda este archivo sobre 03 y 07 hasta que se reescriban)

| Decía | Lo real | Fuente |
|---|---|---|
| Jurídico frío capta en «Fase 2» | No hay Fase 1/2 en los chats: 2–3 preguntas → «¿llamada de 5 min, mañana o tarde?» → cualquier «sí/ok» = captado. Citas = 0 en los 4 perfiles | H 6.1 |
| Captado = evento con evidencia de aceptación | La evidencia es la última frase de la persona (texto del modelo, solo revisado con una regex). Hay un falso captado reciente en Jurídico (mensaje automático + «que no me contacte nadie») | H, J 1.4 |
| Una definición por cifra | Contactados 1.618 vs 3.421 en Jurídico; tasa de respuesta 13,2 % vs 6,3 % según pantalla. «Esperan a una persona» tiene 5 definiciones | H, J 7 |
| Contacto 2 a las 72 h funciona | **0 enviados en todos los perfiles**; 12 en «conflicto» hoy en Jurídico. Bug confirmado en el código (`contacto/reglas.ts`): con objetivo 72 = tope, siempre vence | H, J 3.2 |
| Cada rubro separado | «Mensajes retenidos» muestra los mismos 5 mensajes de Jurídico en los 4 paneles; la línea Penal se ofrece en los 4; avisos push globales; la separación es de interfaz, no de permisos | H, J 6 |
| «No tenemos el registro» si preguntan por el número | Cierto en Jurídico y Autos; en Coberturas (24/10) el bot inventó que vino de redes o formularios | H 6.1 |
| Autos sin financiación inventada | El bot dijo «financiación solo con DNI», «todas las marcas», «se tasa re bien» | H 6.1 |
| 3 líneas Wasender desconectadas | 2 activas caídas (Jurídico y Marketing) + 1 archivada. **Coberturas y 0 km no tienen ninguna.** Al caerse, «Envía mensajes» se apaga sola | H, I |
| Plantillas `*_sb_*` esperando aprobación | Ya están APPROVED en los 4 catálogos | I 5 |
| Laboratorio dentro de Bot IA | Laboratorio, versiones v1/v2 y A/B están en `/perfiles` («Conocimiento del bot») | I 5 |
| 5 agentes | La biblioteca (`agent_library`) está apagada y no afecta producción; los que responden son `ai_agents` | I 1.1 |
| Presupuesto PDF lo arma el sistema | No: el equipo sube un archivo hecho afuera; sale solo por Meta | I 5 |
| Gemini en `ai_agents` | `gemini-3.8-flash` desde la variable `GEMINI_MODEL`; hay 3 proveedores en el código (Gemini API, Vertex, simulado) | I, K |
| Turno del bot en segundo plano | El turno se espera dentro del webhook (60 s); solo Laboratorio e informes usan `after()` | K 2 |
| Landings mandan «desde la web de…» | En `main` de las 4 landings esa frase no existe; la fuente «Landing» del CRM no coincide | K 2 |
| Pase a créditos pagos desactivado | El 20/11 07:23 el dueño lo dejó **activado con freno y checkpoint**. Alcance sin definir (ver preguntas) | K 1 |
| Orden de variantes «reales, no trucos anti-duplicado» | La orden textual del 20/11 06:00 fue reversionar para que Meta no detecte duplicados; lo otro fue interpretación de Claude | K 2 |
| Código de 6 en uso, 8 pendiente | El de 8 ya se publicó el 15/11; el de 6 sigue sirviendo (aviso fijo en la cabecera) | H, K |
| Ramas 88, main `36f742b` | 93 ramas (9 con trabajo propio), 80 PR, `main` en `66c457b` | K 2 |
| «La responsable» | Es hombre; son dos dueños desarrolladores. Corregido en todo el cerebro el 21/11 | dueño |

## 2. Lo que el cerebro no sabía

**Envíos y líneas**
- Tres perfiles sin enviar hace 19–26 días, cada uno por otra causa: Coberturas (error 131042 de pago + pausa «ad»), Autos (calidad baja, pausa automática), Marketing (línea Meta sin acceso al número + pausa por «domingo» que nadie levantó). Hoy no lo dice el tablero: Coberturas figura con calidad alta.
- **No hay pool de chips**: cada campaña usa una sola línea Wasender; la rotación es de textos, no de líneas. Con 4 chips VITA habría que hacer 4 campañas o partir la base. El chat queda atado a la línea donde empezó.
- «Modo prueba» encendido frena los seguimientos de esa línea.
- Los enlaces `wa.me` de redes de Marketing apuntan al chip caído.
- Existe en el panel «Verificar el número en Meta» (Configuración › Líneas), la herramienta para la línea de Marketing sin acceso.
- `hello_world` está asignada como primer contacto en una campaña de 0 km; `contacto_frio_vita` («por tu consulta…») sigue en 3 campañas de Jurídico.
- Wasender: calentamiento 20→40→80→150→250 por día, freno si la respuesta cae bajo 1 %, apagado solo al caerse.
- Marketing «Prioritarios» manda de 9 a 20 (no 8–21) y está apagado.

**Bots y chats**
- El bot no mide ni pregunta la gravedad: el diagnóstico sale de la base; las bases «GRAVES/fracturas» traen mucho no grave. La prioridad por fractura/muerte/amputación se aplica a todos los rubros (`bases/priority.ts`).
- Coberturas sí detecta grupo familiar, pero no pide cantidad, edades ni aportes.
- El bot se presenta con nombre: «Nancy» en Jurídico y Coberturas (nombre configurado), «Leonardo Gonzalez» en Marketing. En 86 chats nadie preguntó si era IA.
- En octubre el bot contestó a contestadores y menús de otros negocios como si fueran personas; hoy en Jurídico se calla, pero esos chats caen en «Atención humana».
- 5 «el modelo no respondió en 20 s» del 17 al 20/11, en una cola de retenidos que nadie revisa; uno generó el falso captado.
- El panel distingue «Agente IA» de «Admin» en cada mensaje.
- Ya se puede adjuntar PDF y video en los chats.
- Marketing guarda «sales intent score» (10–65) y usa datos de Google Maps. «Piden presupuesto» tiene 7 pedidos viejos sin cierre.
- Un chat de prueba del equipo aparece como «Oportunidad real» en Hoy de Marketing; los números de aviso del equipo cuentan como consultas directas.

**Captados y resultados**
- 23 captados esperando derivar (hasta 25 días), 7 derivados sin resultado, 0 ventas.
- «Datos para pasarle…» viene destildado: por defecto sale solo nombre, barrio y teléfono.
- Cierre del bot al captar: en 45 días, en 20 de 26 captaciones no salió (implementado el 15/11, sin verlo en charla real).
- Detenciones vigentes: Jurídico 137, Coberturas 51, Marketing 31, Autos 19. En 4 chats de noviembre la persona preguntó de dónde sacamos el número o habló de denunciar.

**Sistema**
- Avisos web (VAPID), Metricool, Search Console y Vertex: sin configurar en el panel. Tareas del servidor «citas» y «contenido» apagadas.
- Pausa general falla cerrada: si falta la fila `automation_pause`, el bot calla sin aviso.
- Funciones construidas que el cerebro no listaba: formulario de landing → WhatsApp a los 5 min (`form_recibido_<rubro>`), menú del perfil a medida, `/limpieza` (238 reubicados con deshacer), `/contenido` con brief y cola, auditoría de landings, Search Console por OAuth preparada, código de Fase 3 (Vertex, A/B/C, simulador) todavía en el repo, Web Push propio, devolver al bot desde la ficha.
- 08/11: el panel cayó por pago pendiente de Vercel (`DEPLOYMENT_DISABLED`); el dueño pagó y volvió. Figura en plan Hobby.
- Hook `cache-guard`: retiene el primer mensaje tras 5 min de inactividad en chats grandes y pide repetirlo en 2 min (por eso a veces «no entra» un mensaje).

**Redes (sesión «Metricool context»)**
- 392 piezas programadas según el registro de esa sesión (118 del 20–24/11, 260 estáticos 25–29/11, 14 reels del 21/11). Reels nuevos: 25 de 272. Fuentes: `docs/redes/produccion-2011/ESTADO-PROGRAMACION.md`, `registro.csv` y `.ai-context/ORDENES-Y-TAREAS-REDES.md` en la rama `claude/happy-wozniak-ajfi1z`. Hay que comprobar en Metricool.
- Las 8 subsesiones de reels fallaron por el límite de uso; entregaron 6 reels que sí se programaron.
- Fallas de Metricool abiertas: reel de prueba VITA 20/11 16:30 con error; historias Kocos 23/11 reintentadas; sin verificar Kocos IG desde el 18/11.
- Esa sesión escribe «la responsable» en sus documentos: corregir en su rama antes de copiarlos.

## 3. Riesgos y mejoras (propuestas, sin aplicar)

| # | Qué | Por qué | Tamaño |
|---|---|---|---|
| 1 | Arreglar el plazo del contacto 2 (72 h) con prueba | Hoy no sale ningún seguimiento | chico |
| 2 | Guardar el perfil en los mensajes retenidos y filtrar; Penal solo en Jurídico; avisos por rubro | Rompe «cada rubro separado» y muestra datos de un rubro en otro | chico-medio |
| 3 | Evidencia de captación con el id del mensaje real de la persona | Evita falsos captados como el de esta semana | medio |
| 4 | Tope diario de gasto de Gemini por perfil con aviso al 80 % de USD 30 | Hoy no hay freno (hasta 8 llamadas por turno) | medio |
| 5 | Tiempo máximo en el recontacto y no dormir campañas en serie dentro del latido | Una llamada colgada atrasa todo lo automático | chico |
| 6 | Pool de chips Wasender por rubro (rotación y reemplazo ante caída) | Necesario para los 13 chips de esta semana | grande |
| 7 | Una sola definición para cada cifra y para «Esperan a una persona» | Las pantallas se contradicen | medio |
| 8 | Etiqueta de gravedad (fractura, amputación) en bases de Jurídico y prioridad por perfil | Lo pidió el dueño (respuesta 6) | medio |
| 9 | Hoy que diga por qué cada perfil está parado | Coberturas aparece «calidad alta» y no envía | chico |
| 10 | Versionar el job de `pg_cron` (sin el secreto) y alertar si el latido se atrasa | Si se rompe, todo para en silencio | chico |
| 11 | Pantallas en celular: /agentes y /resultados se desbordan | Usan el panel en el celular | chico |

## 4. Preguntas que el panel no responde (solo las de los dueños)

1. Pase automático a créditos pagos de Claude (20/11): ¿sigue activado, con qué tope por mes?
2. ¿Vale reversionar piezas «para que Meta no detecte duplicados» o hacemos variantes con cambios reales?
3. ¿Qué hacen «Derivar» y «Compartir…» hoy: le llega algo al profesional?
4. Penal unificado con Civil: ¿se apaga el agente y la línea PENAL, o queda como rol dentro de Civil?
5. ¿El bot sigue presentándose como «Nancy» y «Leonardo Gonzalez»?
6. ¿Qué servicio de ticket alto vendemos primero en Marketing? (puedo proponer 3)
7. Plan de Vercel: ¿es Hobby? Hobby no admite uso comercial y limita a 60 s.
8. ¿Las 8 subsesiones de reels y «Perfiles redes VITA» eran el mismo chat que «Metricool context»?
</content>
</invoke>
<invoke name="Bash">
<parameter name="command">cd /home/user/LEGAL-CRM && mkdir -p cerebro/biblioteca/analisis-2026-11-21 && cp /home/user/cerebro-privado/analisis/{A,B,C,D,E,F,G,H,I,J,K,L}*.md cerebro/biblioteca/analisis-2026-11-21/ && cd cerebro/biblioteca/analisis-2026-11-21 && grep -nE "\+?54 ?9?[0-9]{2,4}[ -]?[0-9]{3,4}[ -]?[0-9]{4}|[0-9]{10,}|@gmail|909013|DNI [0-9]|CUIL [0-9]" *.md | cut -c1-160 | head -20; grep -n "…2391\|2391" *.md | cut -c1-120