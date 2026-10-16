# Bloque 16/10 · Estética, comparación de agentes y Marketing

Estado: **implementado y probado** (pruebas unitarias 144/144, migraciones validadas en Postgres local: se aplican, se repiten sin error y se revierten; Preview de la rama en READY). **Publicado** al unir el PR en `main`. **No habilitado**: pausa general, agentes apagados y tarea de campañas sin cambios. Nada de esto envía mensajes por sí solo.

Sin las migraciones 0310 y 0311 aplicadas, el código publicado funciona igual que antes: las pantallas nuevas avisan «falta aplicar la migración» y el agente responde sin comparación.

La auditoría general del mismo día está en `docs/etapa3/AUDITORIA_1610.md`.

## 1. Estética por perfil (PR #4, ya en `main`)

- Paletas de marca por variables CSS (`data-tema`) en todo el panel: VITA, Compara tu Obra Social, Automotores Kocos y Kocos Marketing. Contraste AA comprobado.
- Menú unificado (Trabajo diario · Captación · Agentes · Ajustes) con logo y nombre; en teléfono se pliega.
- Detalle: `docs/estetica/LEEME.md`.

## 2. Comparación de agentes A/B/C (migración 0310)

| | A | B | C |
|---|---|---|---|
| Contexto | prompt actual (`ai_agents`) | manual + biblioteca (roles, ejemplos, reglas esenciales) | igual que B |
| Modelo | `gemini-3.6-flash` | `gemini-3.8-flash` | Gemini 3.5 Flash ajustado en Vertex |
| Estado inicial | listo | listo | pendiente (hasta que termine el ajuste) |

- Asignación equilibrada y fija por oportunidad, estratificada por perfil, fuente y frío/actual. La base impide que una oportunidad cambie de candidato.
- Cada turno queda en `agent_turn_logs`: candidato, modelo pedido y el que informó el proveedor, tokens, costo, demora y resultado (enviado, retenido por el validador, error, bloqueado).
- Un fallo fatal (modelo no disponible, permisos) detiene al candidato y ese turno lo responde A. Queda en `agent_incidents`.
- Informes de los días 7, 14, 21 y 28 generados por el latido del servidor (`/api/campaigns/tick`), aunque nadie tenga el panel abierto. Al día 28 se apaga la distribución experimental.
- Panel: **Agentes → Comparación de agentes**. Se puede ver global o por perfil, por semana o el acumulado. Cada cifra abre la lista de prospectos, que usa el mismo filtro que la cifra, y de ahí la ficha y la conversación. Captar se separa del cierre del profesional. Con muestra chica se avisa. Mi recomendación va separada del voto (uno por informe). Gana el más votado; si hay empate o faltan votos, se pide solo esa decisión. Antes de aplicar se comprueban los requisitos y queda guardada la configuración anterior.
- Evaluación de las 35 plantillas (las 33 por rubro y las 2 nuevas de Marketing) por cada modelo. Se procesa de a poco desde el latido.
- Ajuste de C:
  - Primero se importan las conversaciones reales autorizadas: se conservan los nombres y se quitan teléfonos, documentos y correos.
  - Después se estima el costo y se lanza con PIN, con límite de USD 30.
  - El latido sigue el trabajo y, cuando termina, deja a C listo con su endpoint.

## 3. Marketing (migración 0311)

- **Extraer negocios** (menú Captación):
  - Se carga tipo de negocio, zona (toda Argentina o provincias/localidades), cantidad máxima y nombre de base (sugerido y editable).
  - Topes de gasto de Outscraper en `system_settings.limites_outscraper`: 500 por extracción y 1000 por día.
  - Corre una zona por latido y deduplica. Muestra el avance y una tarjeta con «Ejecutar base» y «Ver en Bases».
- **Ejecutar base** (con PIN):
  - Crea la campaña con la línea, la plantilla `mkt_apertura_propuesta`, el agente y los límites de Marketing, y la lanza.
  - Si falta algo, la campaña queda en borrador y se lista exactamente qué falta.
- **Apertura genérica**: no afirma investigación previa. Cuando la persona acepta («sí», «dale», «contame»), se marca la etapa y se hace el análisis profundo: la web del negocio, su ficha y una búsqueda con fuentes reales (Gemini 3.8). Durante la comparación, la síntesis la hace el modelo del candidato.
- **Venta consultiva**: al cerrar, el agente siempre pregunta si quiere presupuesto. Si dice que sí, `pedir_presupuesto`:
  - cuenta como captado;
  - avisa a los números de aviso;
  - promete el presupuesto en menos de 24 h. El agente nunca lo arma.
- **Pide presupuesto** (Trabajo diario):
  - El equipo sube el archivo con total, moneda, alcance y plazo.
  - Con la ventana de 24 h abierta se envía en el momento. Si está cerrada, sale `mkt_presupuesto_listo` y el archivo se manda apenas la persona responda.
  - La IA retoma para cerrar; aprobado = cerrado (`presupuesto_aprobado`).
  - Si no avanza, sigue el seguimiento normal.
- Datos de cada fase (necesidad, servicios, precios, objeciones, plazos) en `marketing_leads.sale_data` y `marketing_budgets`. La etapa se ve en Prospectos y se puede filtrar.

## 4. Correcciones de la auditoría incluidas

- El agente leía los **primeros** 30 mensajes de la conversación en vez de los **últimos**. Corregido.
- Los webhooks de WhatsApp y Meta ahora tienen 60 s de margen (antes, el valor por defecto).
- En Marketing, «pidió presupuesto» (captado) ya no deja la conversación sin IA cuando la persona vuelve a escribir.

## 5. Guía para el programador

1. **Base de datos** (SQL Editor de Supabase, en orden; las dos son repetibles):
   - `supabase/migrations/0310_etapa3_comparacion_agentes.sql`
   - `supabase/migrations/0311_marketing_extraer_y_presupuestos.sql`
   - y, si todavía no se corrió, `14_datos_de_marca_y_fuentes.sql` (marca, nombre del asesor y logos).

   Reversión: `docs/etapa3/sql/revertir_0310.sql` y `revertir_0311.sql`. Se detienen si ya hay datos.
2. **Vercel → Environment Variables** (solo valores, nunca en el chat):
   - `GCP_PROJECT_ID=gen-lang-client-0164247063`
   - `GCP_REGION=us-central1`
   - `GCP_SERVICE_ACCOUNT_JSON`: el JSON de una cuenta de servicio con los roles «Vertex AI User» y «Storage Object Admin».
   - `GCP_BUCKET`: un bucket de Cloud Storage en us-central1.
3. **Meta**:
   - Cargar y aprobar `mkt_apertura_propuesta` y `mkt_presupuesto_listo` (están en el Excel de plantillas).
   - Sincronizar el catálogo.
   - Asignar `mkt_apertura_propuesta` a la línea de Marketing con el propósito «campaña» y la variable {{1}} = «nombre de presentación».
4. **Supabase Storage**: la migración crea el bucket privado `presupuestos`. Si no aparece, crearlo a mano como privado.

## 6. Cómo se arranca (cuando ustedes lo decidan)

1. Aplicar las migraciones y cargar las variables de arriba.
2. Activar el latido: en Supabase, `cron.job` «campaigns-tick» está **inactivo**. Sin el latido no hay informes, extracciones, seguimientos ni campañas. Con la pausa general puesta, activarlo no envía nada.
3. En Comparación de agentes, revisar los candidatos y tocar «Arrancar experimento» (PIN). Mientras C esté pendiente, compiten A y B.
4. Levantar la pausa general y encender los agentes, perfil por perfil, desde Configuración y Agentes IA. Esto es decisión de ustedes.
5. Para C: «Importar conversaciones» y después «Lanzar ajuste (pago)», ambos con PIN.
