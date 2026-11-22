# Traspaso 22/11 (d) · para retomar después de compactar

## Estado publicado (main)
- Rediseño completo, Jarvis puede hacer TODO con confirmación reforzada (02), `/asistente` con gráficos, `/laboratorio` por rubro con roles, `/resumen`, `/cerebro` con recomendaciones y reglas.
- **Oficina por sectores en 3D** (`/oficina?sector=redes`): la misma escena animada; cada sector muestra sus puestos (guionista, render…) con el motor de cada uno (`src/lib/oficina/sectores.ts`, `puestosDeSector`). Fila de entradas arriba; el edificio de tarjetas se sacó (el dueño no lo quería). Dirección = «Cerebro (dirección)».
- **Jarvis consulta el cerebro**: herramienta `consultar_cerebro` (`src/lib/jarvis/cerebro-memoria*.ts`); los 120 `.md` de `cerebro/` viajan con el despliegue (`outputFileTracingIncludes` en `next.config.mjs`).
- **Graphify** en todos lados: hook `.claude/hooks/graphify.sh` + skill en los 5 repos (rama `claude/admiring-euler-ctf4sg` en los otros 4), script de arranque del entorno «LEGAL-CRM» (sin probar hasta una sesión nueva), mapa en `cerebro/mapa-codigo/`.
- Propuestas escritas (esperan OK de pago): `biblioteca/propuesta-lineas-codigo-agentes-2211.md` (Evolution API, granja de 7 teléfonos con DeviceFarmer + reenviador de SMS, Jarvis con código vía rama + vista previa).

## Recorrido real del panel (22/11, con sesión) — qué es decoración hoy
| Pantalla | Qué tiene | Qué falta para que sirva |
|---|---|---|
| `/resumen` | Anillos y enlaces, **0 botones** | Acciones en lugar: responder/derivar/agendar desde la fila, filtros por perfil, marcar hecho, tareas propias con fecha |
| `/contactos` (Etapas) | Recorrido y 4 botones | **Buscar, filtrar, ordenar, abrir ficha, mover de etapa, derivar, exportar, acciones en lote** (se perdieron con el rediseño: revisar `git log -- src/app/contactos src/components/contactos`) |
| `/agenda` (Citas) | Lista, 4 botones | Crear/mover/cancelar cita, recordatorio, vista semana |
| `/laboratorio` | Roles por rubro, ficha | Probar el bot con un mensaje (simulador), comparar respuestas, publicar agente con PIN, historial de cambios |
| `/cerebro` | 39 botones, lo más completo | Más fuentes (Metricool, Vercel, Supabase), timeline de aprendizajes, decisiones aprobadas |
| `/asistente` | Chat y gráficos | Pedidos encadenados, historial de propuestas confirmadas |
| `/oficina` | 3D por sectores | Que «Arrancar ahora» dispare sesiones reales por sector (depende del plan de Claude) |
| Secciones de «Más» | Diseño viejo | Pasarlas a la estética nueva (anillos, sombras, motion) |

## Próximo paso (en este orden)
1. **Contactos**: recuperar funciones perdidas y ponerlas a la vista (buscar, filtros, acciones). Es lo que más usa el dueño.
2. **Resumen**: acciones reales por fila.
3. Secciones de «Más» con la estética nueva.
4. Laboratorio: simulador del bot.
5. Citas: crear y mover.
6. Pantalla «Teléfonos» cuando el dueño dé OK a la granja.

## Reglas que siguen
- El código de ingreso al panel lo dio el dueño en el chat: **no se escribe en archivos**; se pasa solo como variable `PANEL_CODE` al correr Playwright.
- Créditos: Sonnet y Opus con tope semanal hasta el 26/11 22:00 UTC; los subagentes fallan hasta entonces. Hacer lo esencial directo.
- Nada se borra; rubros separados; no se paga nada sin OK; sin capturas al dueño; estética clásica sin fondo raro.
- Script de humo: `scratchpad/humo2.js` (rutas en la primera línea `const rutas=`), recorrido: `scratchpad/recorrido.js`.
