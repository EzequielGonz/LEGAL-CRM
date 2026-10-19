# CRM multirubro · instrucciones para Claude

Panel de captación para cuatro perfiles (Jurídico con Civil y Penal, Coberturas médicas, Autos 0 km y Marketing) sobre Next.js 14, Supabase y la API oficial de Meta, publicado en Vercel.

## Leer primero

- `.claude/referencias/reglas-comunes.md`: las reglas de negocio y de operación, en un solo lugar y con versión. **Obligatoria antes de tocar comportamiento.**
- `.claude/skills/kocos-crm-contexto`: etapas, autorizaciones, estado operativo, entrega y migraciones.
- Según la tarea: `kocos-crm-reglas-de-captacion` (recorridos de prospectos), `kocos-crm-diseno-y-accesibilidad` (pantallas y experiencia), `kocos-crm-pruebas-de-aceptacion` (pruebas y entrega segura), `kocos-landings-seo-y-conversion`, `kocos-contenido-y-publicacion`, `kocos-agentes-entrenamiento-y-evaluacion`.
- `.claude/referencias/casos-de-aceptacion.md`: casos A01–A35 con su correspondencia y estado.
- `.claude/referencias/bandeja-claude.md`: qué hacer cuando la responsable dice «ok» para que Claude tome las tareas de la Bandeja para Claude.
- Las demás carpetas de `.claude/skills` son de terceros (ver `PROCEDENCIA.md`); si contradicen al proyecto, prevalece el proyecto.

## Reglas que no se negocian

1. Solo se ejecuta lo autorizado: cada etapa o bloque empieza cuando la responsable lo indica. Un documento nuevo se analiza, no se implementa por inferencia.
2. Nada se activa solo: se conservan la pausa general, los agentes apagados, la tarea de campañas inactiva, las campañas pausadas y el seguimiento apagado. Publicar código no habilita envíos.
3. Sin contacto real con prospectos, sin envíos de prueba a personas, sin campañas, sin trabajos pagos y sin publicar en producción ni en canales externos sin autorización expresa o una política habilitada por la responsable.
4. Nada se borra: se archiva con motivo. Una migración se aplica después de comprobar la versión y el historial real de la base, y solo con la actualización necesaria y verificada: ni repetir a ciegas lo ya aplicado ni descartar controles existentes.
5. Ningún secreto en el chat, el código, los registros ni los informes. No se descifran variables de entorno. No se piden tokens ni claves pegados en el chat.
6. Ningún dato personal real en pruebas, ejemplos, capturas ni corpus.
7. La Preview comparte base y líneas con producción: ahí solo se mira. Las pruebas con efectos van a un entorno temporal aislado con datos ficticios y Meta simulado.
8. Desde el 15/10 la responsable autorizó que Claude implemente directamente (GitHub, base, configuración y despliegue) conservando pausas; si una herramienta no lo permite, se entrega ZIP `kocos-pipeline-*.zip`. Ningún pago sin autorización.
9. Cada informe distingue especificado, implementado, probado, publicado y habilitado, con la versión comprobada.

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
