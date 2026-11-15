# Laboratorio del bot · entrega (15/11)

Pedido de la responsable: un «Laboratorio del bot» en /perfiles, al lado del título «Conocimiento del bot», para crear y probar versiones nuevas sin tocar lo que rige.

Decisión de la responsable (15/11, por el coordinador): se autoriza crear versiones nuevas (v3…) y elegir otros modelos de Gemini desde el laboratorio. Lo que rige en vivo sigue siendo lo de siempre (v2 con fichas sumadas y el modelo principal): el laboratorio solo agrega la posibilidad manual.

## Qué incluye

- **Botón «Laboratorio del bot»** (`conocimiento-bot.tsx`) que despliega el panel; selector «Todos los perfiles» o uno; seis pestañas con teclado (flechas, Inicio, Fin).
- **Versiones**: lista con insignias Borrador / En prueba / Activa / Archivada; crear una versión nueva como COPIA de otra (fichas nuevas, tono, reglas, roles copiados y modelo); aplicar a todo un perfil con las diferencias a la vista y el aviso «esto cambia cómo responde el bot en charlas reales»; volver a lo anterior; archivar (no se borra).
- **Modelos de IA**: lista de modelos de Gemini leída de la API con la clave del servidor (listar no tiene costo) o, si falla, la lista configurable `LABORATORIO_MODELOS`; modelo por versión (solo mientras no responde charlas). Proveedores externos: nombre, dirección y NOMBRE de la variable de entorno; figuran «Preparado, sin conectar»; no hay llamadas ni claves.
- **Roles y fichas**: biblioteca de roles de los cuatro perfiles y generales con búsqueda; aplicar a todo el perfil, a un tipo de consulta, a una base o a una campaña (con confirmación y vuelta atrás); copiar a otro perfil; «editar» crea una copia (el original no cambia); fichas de cada versión para consultar.
- **Pruebas**: simuladas con el mismo camino que «Probar el bot real» (no escriben en conversaciones, contactos ni campañas) con batería sintética (crisis, enojo, contestador, pedido de ignorar instrucciones, precio y casos de cada rubro) o casos propios; A/B por campaña (20 % y 7 días por defecto, solo charlas nuevas, asignación estable, se corta sola, «Cortar ahora»).
- **Comparativas e informes**: la misma tabla de cifras para N versiones y para las variantes de cada A/B, por perfil o sumando, por período, con «Datos insuficientes» bajo 30 conversaciones; el «Informe de mejoras del bot» existente, reutilizado.
- **Asistente**: abre el asistente del perfil con el estado de sus bots ya escrito y pedidos rápidos.

## Precedencia en una charla real

La prueba A/B de la campaña decide versión y modelo (solo charlas de esa campaña cuyo envío es posterior al inicio de la prueba). Los roles no dependen del A/B: rol de la campaña > rol de la base > rol por tipo de consulta (área civil/penal antes que modo) > rol de todo el perfil. Si la versión en prueba trae roles copiados y la campaña tiene su rol, se suman y el de la campaña va último: ante un choque, manda. Al vencer o cortar una prueba, desde la respuesta siguiente atiende la versión activa. Si el modelo elegido no existe para Gemini, esa respuesta sale con el modelo de siempre y queda registrado. Sin nada del laboratorio aplicado, el pedido al modelo es idéntico al de hoy (prueba unitaria). La capa fija (crisis, enojo, amenaza, precios, contestadores, tope por persona, validador y cierre) rige igual en las versiones de prueba: actúa antes y después del modelo y no depende de la versión.

## Archivos

- Reglas puras: `src/lib/laboratorio/reglas.ts`, `src/lib/laboratorio/casos.ts`.
- Servidor: `src/lib/laboratorio/servicio.ts`, `en-vivo.ts`, `modelos.ts`; ruta `src/app/api/perfiles/laboratorio/route.ts`.
- Bot: `src/lib/ai-agent/agent.ts` (plan del laboratorio), `src/lib/ai-agent/probar-real.ts` (opciones `modelo`, `extras`, `rolLaboratorio`).
- Pantallas: `src/components/perfiles/laboratorio/*.tsx` y el botón en `src/components/perfiles/conocimiento-bot.tsx`.
- Catálogo del asistente: `perfiles/laboratorio` en `FUERA_DEL_CATALOGO` con su motivo.
- Migraciones: `supabase/migrations/0630_laboratorio_bot.sql`, `0631_laboratorio_bot_funciones.sql` (ver `MIGRACIONES.md`).
- Pruebas: `tests/unitarias/laboratorio-bot.test.ts`.

## Estados (regla 9)

- Especificado: pedido del 15/11 y criterios del coordinador.
- Implementado: sí, en la rama de esta copia.
- Probado: typecheck, pruebas unitarias (537 en verde), eslint del proyecto, build; migraciones en un Postgres 16 local descartable. Sin recorrido en navegador ni prueba contra la base real (ver `INFORME.md`).
- Publicado: no.
- Habilitado: no. Aun publicado, nada rige hasta que alguien aplique algo a mano desde el laboratorio.
