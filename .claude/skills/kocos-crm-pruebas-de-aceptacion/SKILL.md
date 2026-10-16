---
name: kocos-crm-pruebas-de-aceptacion
description: Cómo probar, revisar y entregar con seguridad cualquier cambio del CRM - comandos, base de pruebas, Meta simulado, pruebas de regresión, migraciones, casos de control (C01-C12, V01-V14, A01-A35), revisión de diferencias, sesión, datos, secretos y efectos externos, e informe con los cinco estados. Usar al escribir o correr pruebas, al revisar o verificar una entrega, al cambiar código, datos, proveedor de IA, permisos o publicación, y al redactar un informe.
---

# Pruebas de aceptación y entrega segura

Cubre los procedimientos «crm-release-security» (parche 2.0, sección 25.8) y la comprobación de skills (25.9). Nada se entrega sin evidencia. Cada bloque: implementar, compilar y revisar tipos, probar con datos controlados, comparar la base antes y después con consultas directas, y recién entonces seguir.

## Comandos (desde la raíz)

```bash
npm ci
npm run typecheck                          # tipos de la aplicación
npx tsc -p tests/tsconfig.json --noEmit    # tipos de las pruebas
npm run lint
npm run build                              # compila; con variables ficticias si hace falta
npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts
bash tests/integracion/correr.sh           # PostgreSQL y PostgREST con Docker, base desde cero
npm audit --omit=dev
```

- Sin Docker: PostgreSQL y PostgREST 12.2.3 propios con `PSQL`, `PRUEBAS_PSQL`, `PRUEBAS_REST_URL` y `PRUEBAS_JWT_SECRET` (ver `tests/integracion/correr.sh` y `preparar_base.sh`).
- `tests/sin-npm/` imita Supabase, `next/server` y Google GenAI **solo** donde npm está bloqueado. Un resultado con esas imitaciones se informa así y no reemplaza la verificación con dependencias reales en el entorno aislado (sandbox temporal de Vercel sin variables del proyecto) o en la Preview de la rama.
- Las rutas privadas exigen sesión: en las pruebas se usa `pedido(...)` y `prepararSesionDePrueba()` de `tests/integracion/soporte/entorno.ts`.

## Reglas de las pruebas

- Datos inventados siempre (teléfonos `54 9 11 00 …`, nombres de prueba); ningún dato de producción.
- Red simulada (`tests/integracion/soporte/entorno.ts`): Supabase redirigido a la base de pruebas, Storage en memoria, Meta responde lo que indica cada prueba; cualquier otra dirección externa hace fallar la prueba. Ninguna prueba envía un mensaje real.
- La Preview no es un entorno de pruebas (comparte base y líneas con producción): solo se mira (caso V14 / A35).
- Cada corrección trae su regresión y se comprueba que falla con el código anterior. El reloj se inyecta (`now`, `clock`); los casos límite van al segundo.
- Las pruebas no dependen del orden ni de datos dejados por otra prueba.

## Revisión antes de entregar (seguridad de la entrega)

1. Identificar fuente, entorno y alcance del cambio; confirmar la versión real del repositorio y del despliegue (no suponer `fb5cdc3` ni que un ZIP recibido esté publicado).
2. Revisar diferencias y migraciones; sesión y autorización en cada operación privada; relaciones entre perfil, oportunidad, conversación, base, campaña, línea y agente; secretos; efectos externos (Meta, publicaciones, trabajos pagos).
3. Comprobar aislamiento antes de probar envíos. Ejecutar compilación, tipos, lint, unitarias, integración y `npm audit` con dependencias reales.
4. Confirmar que «Guardado» corresponde a una respuesta exitosa del servidor (caso A34).
5. Registrar por separado publicación, habilitación y recuperación; mantener pausas y tareas en el estado decidido.
6. No declarar seguridad absoluta, pruebas no ejecutadas ni despliegue completo por una compilación local.

## Migraciones

Cada migración nueva se prueba: sobre una base nueva con todas las migraciones; dos veces seguidas; sobre la versión anterior si existía; con la versión publicada funcionando encima; con su reversión (que se detiene si hay datos); y comprobando después RLS, cero permisos para la clave pública, funciones sin permiso público y contadores operativos sin cambios. Antes de indicar una aplicación en producción se comprueba el historial real de la base (regla 9 de `.claude/referencias/reglas-comunes.md`).

## Casos de control

- **C01 a C12** (documento único, capítulo 40) y **V01 a V14** (parche 1.0).
- **A01 a A35** (parche 2.0): tabla con correspondencia, pruebas existentes y estado en **`.claude/referencias/casos-de-aceptacion.md`**. Se actualiza en cada entrega.
- Etapa 3: T01 a T50, H01 a H24, plantillas y humanización, solo en el simulador.

## Comprobación de las skills del proyecto

Cada skill `kocos-*` se prueba con una tarea concreta (abrir un indicador y llegar al cliente; crear un derivado sin copiar conversaciones; rechazar un frío sin insistir; preparar un dataset con un cierre inválido; pedir una mejora de landing sin editor técnico; programar una pieza con token vencido; recibir una pausa mientras se genera una respuesta) y se registra qué skill cargó y qué produjo. Las skills no conceden permisos, no guardan tokens y no reemplazan herramientas; `python3 -I` sobre `.claude/skills` valida nombre y descripción de cada una.

## Informe de la entrega

Tabla de lo realmente corrido con números, versiones y entorno; lo que falló y qué se hizo; lo que no se pudo comprobar en su propia sección; huellas SHA-256 del ZIP y del parche y la comprobación de que el ZIP aplicado coincide con el parche aplicado; y la etiqueta de cada función en los cinco estados (especificado, implementado, probado, publicado, habilitado).
