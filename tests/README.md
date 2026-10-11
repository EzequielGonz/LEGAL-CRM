# Pruebas

Dos grupos, los dos reproducibles desde el repositorio y sin ningún dato real:

| Grupo | Qué prueba | Qué necesita |
|---|---|---|
| `tests/unitarias/` | Funciones puras: pausa general, clasificación de errores de envío, barrio y domicilio, estados en el Inbox, adjuntos, acceso, firma de Meta, importación, plantillas, avisos web | Node 20+ y `npm ci` |
| `tests/integracion/` | De punta a punta contra una base de pruebas: pausa general, envíos de campaña sin duplicados, reintentos y fallas al guardar, errores técnicos, intervención humana, estados de entrega, guardado de originales | Lo anterior + Docker (`docker compose`) |

Ninguna prueba puede enviar un mensaje real: toda la red está simulada
(`tests/integracion/soporte/entorno.ts`). La API de Supabase se redirige a la
base de pruebas, Storage se guarda en memoria y Meta responde lo que cada
prueba indica. Cualquier otra dirección externa hace fallar la prueba.

## Comandos (desde la raíz del repositorio)

```bash
npm ci

# Tipos de la aplicación y de las pruebas, con las dependencias reales
npm run typecheck
npx tsc -p tests/tsconfig.json --noEmit

# Pruebas unitarias
npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts

# Pruebas de integración (levanta PostgreSQL 16 y PostgREST 12.2.3 con Docker,
# crea la base desde cero, corre las pruebas y apaga todo)
bash tests/integracion/correr.sh
```

`correr.sh` deja los contenedores apagados al terminar; con `CONSERVAR=1` los
deja levantados para revisar la base (`localhost:55433`, usuario `postgres`,
clave `pruebas`, base `crm_pruebas`).

## Cómo se arma la base de pruebas

`tests/integracion/preparar_base.sh` crea la base desde cero, siempre igual:

1. `sql/00_supabase_minimo.sql`: roles de la API, esquema `auth` y permisos por
   defecto, como los trae Supabase.
2. `sql/01_estructura_previa_etapa1.sql`: la estructura de producción del
   9/10/2026, antes de la Etapa 1, **sin datos**.
3. `sql/02_referencia.sql`: perfiles y canales con nombres de prueba.
4. **Todas las migraciones del repositorio, en orden** (`supabase/migrations/0100`
   … `0117` y `0199`). Así también se comprueba que las migraciones se aplican
   sobre la base real anterior.
5. Aviso a la API para que relea la estructura.

Cada prueba crea sus propios contactos inventados (teléfonos `54 9 11 00 …`).

## Qué prueba cada archivo

| Archivo | Corrección |
|---|---|
| `unitarias/pausa-general.test.ts`, `integracion/pausa-general.int.test.ts` | 1. Pausa general ante configuración incompleta |
| `integracion/campanas-envio-seguro.int.test.ts` | 2. Reserva atómica, ejecuciones simultáneas, reintentos y fallas al guardar el resultado; 5. errores técnicos en campañas |
| `integracion/intervencion-humana.int.test.ts` | 3. Intervención humana, respuestas de la IA en curso y acuse final autorizado |
| `integracion/seguimientos-marketing.int.test.ts` | 3, 4 y 5 en los seguimientos automáticos de Marketing (revalidación antes de enviar, identificador de Meta, resultado incierto) |
| `unitarias/inbox-estados.test.ts`, `integracion/estados-entrega.int.test.ts` | 4. Identificador y estado de los mensajes de campaña; polling del Inbox |
| `unitarias/errores-envio.test.ts` | 5. Errores técnicos e inciertos que no se atribuyen al prospecto |
| `unitarias/ficha-barrio.test.ts` | 6. Barrio y domicilio en la ficha |
| `unitarias/adjuntos-modelo.test.ts`, `integracion/adjuntos.int.test.ts` | Guardado privado de originales (pregunta 24, alcance acotado) |

## Reproducción con la versión revisada

`tests/reproduccion/` confirma los 6 puntos de la revisión del 10/10 con la versión anterior
(`kocos-pipeline-etapa1.zip` sobre `7c721bf`). Ver `tests/reproduccion/README.md`.

## Sin acceso a npm

`tests/sin-npm/` tiene imitaciones mínimas de `@supabase/supabase-js`,
`next/server` y `@google/genai`, solo para correr las mismas pruebas en un
entorno donde no se pueden instalar las dependencias (así se corrieron al
preparar la entrega). **No reemplazan la verificación con las dependencias
reales** de los comandos de arriba, que es la que vale.

```bash
PRUEBAS_REST_URL=http://127.0.0.1:54331 PRUEBAS_PSQL="psql -h localhost -p 5432 -U postgres -d crm_pruebas" \
  npx --yes tsx@4.23.12 --tsconfig tests/sin-npm/tsconfig.json --test tests/integracion/*.int.test.ts
```
