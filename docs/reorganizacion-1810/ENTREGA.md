# Reorganización 18/10 · Entrega

Pedido de la responsable del 18/10: panel renovado, menú ordenado, asistente IA y redes manejadas desde el panel. PR #19 (`reorganizacion-1810` → `main`).

## Qué incluye

| Área | Cambio | Archivos principales |
|---|---|---|
| Visual | Superficies neutras, botones sólidos, menú claro, pestañas por sección, tarjetas limpias. Se carga después del resto de los estilos. | `src/app/renovacion.css`, `src/app/layout.tsx` |
| Menú | Seis secciones iguales en los cuatro perfiles: Inicio, Conversaciones, Contactos (con Citas), Captación, Redes y contenido, Configuración. | `src/lib/menu.ts`, `src/components/menu-perfil.tsx`, `src/components/perfiles/encabezado-panel.tsx` |
| Simple/Avanzado | Se quitó el selector. Lo avanzado (`solo-avanzado`) se despliega con «Más opciones» al pie y se vuelve a plegar al cambiar de pantalla. `?nivel=avanzado` lo abre desplegado. | `src/components/nivel/nivel.tsx`, `src/components/perfiles/marco-perfil.tsx` |
| Inicio | Captados sin derivar primero, con su cita (marca «Fase 2» si la agendó la IA). Las cifras en cero quedan en «Más opciones». | `src/app/hoy/page.tsx`, `src/lib/inicio.ts` |
| Perfiles | Tarjeta alargada por perfil con pendientes, lápiz (nombre, nombre interno, logo, color) y tres puntos (cargar/revisar/pausar campaña, programar publicaciones, entrar). | `src/components/perfiles/perfil-selector.tsx`, `src/app/perfiles/page.tsx`, `src/app/api/perfiles/marca/route.ts`, `src/lib/acento.ts` |
| Asistente | Panel lateral con pedidos en palabras. Lo que cambia algo vuelve como propuesta y se ejecuta solo con «Confirmar». Tipos: publicaciones, cambio de bot (con «Deshacer»), pausar campaña. | `src/lib/asistente/*`, `src/app/api/asistente/**`, `src/components/asistente/*` |
| Bots | Puntaje 0–100 con resultados reales (no inventa cifra con pocos datos). Instrucciones completas en «Más opciones». | `src/lib/agentes/puntaje.ts`, `src/components/agentes/puntaje-bots.tsx` |
| Publicaciones | Calendario en Instagram y Facebook vía Metricool: posteos con imagen, historias y carruseles (sin videos). Imágenes generadas en `/piezas/[id]/[n].png`. Cancelar deja historial. | `src/lib/redes/{metricool,programar}.ts`, `src/app/redes/page.tsx`, `src/components/redes/calendario-publicaciones.tsx` |
| WhatsApp | Perfil de empresa por línea (foto, info, descripción, mail, web, rubro). | `src/lib/redes/whatsapp-perfil.ts`, `src/app/redes/whatsapp/page.tsx` |
| Plantillas | Carga por CSV/Excel/JSON; reconoce el perfil por columna o prefijo y manda cada una a la línea de su perfil. Primero muestra qué hará. | `src/lib/plantillas/archivo.ts`, `src/app/redes/plantillas/page.tsx` |
| Publicidad | Configuración guardada y **apagada**. El botón de encender está deshabilitado. | `src/lib/redes/publicidad.ts`, `src/app/redes/publicidad/page.tsx` |
| Origen | Enlace de WhatsApp con mensaje prearmado por red; el panel reconoce la fuente de cada contacto. | `src/lib/redes/ctas.ts`, `src/lib/redes/conexion.ts` |
| Base | `0500_asistente_y_redes.sql`: tabla `asistente_acciones` (RLS, sin permisos públicos), depósito `marca` para logos y ajuste `publicidad` apagado. Aditiva y repetible. **Ya aplicada.** | `supabase/migrations/0500_asistente_y_redes.sql` |

## Qué no hace

- No inicia campañas, no envía mensajes a prospectos y no gasta.
- Las publicaciones salen solo con `METRICOOL_USER_TOKEN` y `METRICOOL_USER_ID` cargados en Vercel, el número de marca (blogId) del perfil y «Publicar solo lo que confirme» activado. Sin eso, quedan «listas».
- La biografía y la foto de Instagram no se pueden cambiar por API: se editan en la app.

## Para el programador

1. Revisar el PR #19. Los estilos nuevos están todos en `renovacion.css`; `globals.css`, `panel.css` y `marca.ts` no cambiaron.
2. Variables nuevas (opcionales): `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID`. Ya se usan `GEMINI_MODEL` y `META_APP_ID`.
3. Revertir: revertir el merge del PR. La migración 0500 solo agrega; puede quedar.

## Evidencia

Ver `CONTEXTO_ACTUAL_CRM.md` (sección «Reorganización 18/10»).
