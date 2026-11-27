# CRM multirubro · instrucciones para Claude

Panel de captación para cuatro perfiles (Jurídico con Civil y Penal, Coberturas médicas, Autos 0 km y Marketing) sobre Next.js 15.5, Supabase y la API oficial de Meta, publicado en Vercel.

## Regla número uno (22/11): arranque obligatorio para todos

**Claude y cada subagente** (copias aisladas, escritorios de la Oficina, tareas programadas) leen `cerebro/00-arranque-para-agentes.md` antes de empezar. Ahí está el cerebro completo, y cada uno usa **todas** las skills, plugins, conectores y agentes que sumen. Quien delega copia esa línea en el pedido. Al cerrar, se informa qué herramientas se usaron.

## Leer primero

- **Graphify:** mapa del código en `cerebro/mapa-codigo/` y mapa de los documentos del cerebro y la memoria en `cerebro/mapa-cerebro/` (`graphify explain|section|path "X" --graph <mapa>/graph.json`). Consultalos antes de buscar con grep.
- **`cerebro/README.md`**: la memoria de Claude. Índice, cómo arrancar en 5 minutos y cómo cerrar cada vuelta. Desde ahí: `02-ordenes-vigentes.md` (qué manda hoy), `07-estado-verificado.md` (qué está encendido) y `08-pendientes-y-plan.md` (qué sigue). Se actualiza al cierre de cada vuelta, con commit y push.
- Detalle fino cuando la tarea lo pide: `.claude/referencias/reglas-comunes.md` (reglas de negocio), `.claude/referencias/casos-de-aceptacion.md` (A01–A35), `.claude/referencias/redes/` (dirección de arte, marcas, logos), `.claude/referencias/bandeja-claude.md` (cuando la responsable dice «ok»), `docs/ESTADO.md` (historial operativo largo).
- Skills del proyecto según la tarea: `kocos-crm-contexto`, `kocos-crm-reglas-de-captacion`, `kocos-crm-diseno-y-accesibilidad`, `kocos-crm-pruebas-de-aceptacion`, `kocos-landings-seo-y-conversion`, `kocos-contenido-y-publicacion`, `kocos-agentes-entrenamiento-y-evaluacion`. Las demás carpetas de `.claude/skills` son de terceros (`PROCEDENCIA.md`); si contradicen al proyecto, prevalece el proyecto.

## Skills, plugins, agentes y roles (15/11 y 20/11)

- Claude trabaja como agencia premium completa e ingeniería senior: ver roles y herramientas por tarea en `cerebro/11-equipo-y-herramientas.md`.
- En cada tarea se usan **todas** las skills, plugins, conectores y agentes que sumen calidad, sin pedir permiso, y se buscan más al empezar (`SearchSkills`, `SearchPlugins`, `coding-skills:find-skill`).
- Trabajos grandes: agentes en paralelo (copias separadas si tocan código), revisión cruzada y segunda opinión de otro modelo cuando esté disponible. Al delegar, pasar la lista de skills útiles y permiso para usar otras.

## Única restricción (20/11)

**No se paga nada sin autorización expresa de la responsable**: créditos, planes, publicidad, generadores pagos, servidores, dominios. Todo lo demás Claude lo implementa, prueba, publica y verifica directo (GitHub, base, configuración, despliegue, Metricool), sin pedir «dale» por cada paso.

## Decisiones de la responsable que se respetan (no son trabas de proceso)

- Las campañas con bases y las publicidades **las lanza la responsable** (confirmado 20/11): Claude las deja listas.
- Nada se borra: se archiva o pasa a borrador con motivo.
- Cada rubro separado: nada de un perfil se ve ni se abre desde otro.
- No tocar la bio ni el botón de los perfiles de redes.
- El resto de las órdenes vigentes, reconciliadas, en `cerebro/02-ordenes-vigentes.md`.

## Oficio que se mantiene

- Claves solo en las variables de Vercel; nunca en el repo, el chat ni los informes. El código de ingreso al panel no se guarda en archivos.
- Datos personales de prospectos fuera de documentos, pruebas y corpus.
- La Preview comparte base y líneas con producción: probar ahí tiene efectos reales.
- Antes de informar qué está encendido, se comprueba en la base.
- Cada informe distingue especificado, implementado, probado, publicado y habilitado, con la versión comprobada.

## Comandos

```bash
npm ci
npm run dev
npm run typecheck && npx tsc -p tests/tsconfig.json --noEmit
npm run lint
npm run build
npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts
bash tests/integracion/correr.sh
npm audit --omit=dev
```

## Convenciones

- Textos de la interfaz, comentarios y documentos en español rioplatense, con voseo.
- Reglas de negocio en funciones puras de `src/lib/` con pruebas unitarias; acceso a datos en el servidor con la clave de servicio; toda ruta privada llama a `requireSession` y comprueba las relaciones entre recursos.
- Migraciones en `supabase/migrations/`, numeradas por etapa (`01xx`, `02xx`), repetibles sin error, con RLS, sin permisos para la clave pública y sin borrados.
- Cada entrega documenta en `docs/etapaN/` qué incluye (`ENTREGA.md`), qué se probó y qué no (`INFORME.md`) y cómo aplicar o revertir la base (`MIGRACIONES.md`).
