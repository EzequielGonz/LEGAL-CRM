# Laboratorio del bot · migraciones (15/11)

**No están aplicadas.** Las aplica el coordinador después de comprobar el historial real de la base.

## 0630_laboratorio_bot.sql

Siete tablas NUEVAS (`bot_lab_versiones`, `bot_lab_proveedores`, `bot_lab_roles_generales`, `bot_lab_aplicaciones`, `bot_lab_pruebas_ab`, `bot_lab_ab_asignaciones`, `bot_lab_simulaciones`) con índices en sus claves foráneas. Repetible (`if not exists`), RLS activado, `revoke all` para `anon` y `authenticated`. No modifica ni borra datos existentes. Tablas nuevas y vacías: crear sus índices no bloquea tablas en uso.

## 0631_laboratorio_bot_funciones.sql

- `laboratorio_crear_version(...)`: crea v3, v4… en una transacción (con un candado para que dos personas no tomen el mismo número): fila nueva en `bot_knowledge_versions`, copia de las fichas de la versión de origen (generales, comunes y de los perfiles elegidos) con el número nuevo, fichas nuevas, fila en `bot_lab_versiones` y línea en `ops_change_log`. Solo inserta.
- `laboratorio_estadisticas_ab(uuid)`: cifras por variante de una prueba A/B (solo lectura), con la misma definición que `conocimiento_estadisticas`.
- `create or replace`, `search_path` fijo, sin ejecución para `public`, `anon` ni `authenticated`; ejecución para `service_role`.

Probado en un Postgres 16 local descartable con tablas mínimas equivalentes: las dos se aplican dos veces seguidas sin error; la función crea v3 y v4 y copia lo que corresponde; las cifras A/B salen por variante; `anon` no puede leer ni ejecutar. No se probó contra la base real (solo se leyó su esquema).

## Orden y compatibilidad

1. Publicar el código antes o después da lo mismo: sin las tablas, el bot en vivo registra un aviso una vez por minuto y responde como siempre (estado vacío del laboratorio); la pantalla del laboratorio muestra un error genérico.
2. Aplicar 0630 y después 0631.

## Volver atrás (sin borrar)

1. Desde el laboratorio: «Volver a lo anterior» en cada aplicación vigente y «Cortar ahora» en cada A/B en curso. Con eso nada del laboratorio rige (las versiones v3+ quedan creadas, sin asignar). Tarda hasta 1 minuto en regir.
2. Las tablas y funciones pueden quedar: sin filas vigentes no cambian nada. Si hiciera falta quitarlas, se decide aparte con la responsable (quitarlas pierde el historial de pruebas).
3. Si una versión del laboratorio quedó asignada por otro camino, en «Conocimiento del bot» se elige «Usar v2».
