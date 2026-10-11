# Etapa 1 — Entrega corregida (revisión del 10/10) y cómo incorporarla

Esta entrega reemplaza a `kocos-pipeline-etapa1.zip`: incluye todo lo de la Etapa 1, las respuestas del
10/10 (preguntas 22 y 39), las 6 correcciones de la revisión y el guardado privado de originales.
**No hace falta aplicar el zip anterior.**

## Archivos

| Archivo | Para qué |
|---|---|
| `kocos-pipeline-etapa1-correcciones.zip` | **Proyecto completo**: todos los archivos de `7c721bf` con los cambios (sin `node_modules`, `.next` ni `.github`). Se compila tal cual o se aplica con el flujo "Aplicar pipeline Kocos" |
| `etapa1-correcciones-sobre-7c721bf.patch` | Los mismos cambios como diferencia exacta sobre `7c721bf`, para `git apply` |
| `SHA256SUMS.txt` | Huellas SHA-256 de los dos archivos anteriores y de cada archivo del proyecto, y el árbol de git esperado después de aplicar |

## Versión de partida exacta

`EzequielGonz/LEGAL-CRM`, rama `main`, commit **`7c721bfae473b8d8a8bae1823c9d3a6bbd395540`**
("Aplicar pipeline de Marketing", 8/10/2026). Es la versión publicada hoy en producción.
Respecto de ella, la entrega modifica 83 archivos y agrega el resto; no borra ninguno.

## Opción A — Rama nueva con el flujo "Aplicar pipeline Kocos" (para verificar en Preview)

1. En GitHub, crear una rama desde `main`, por ejemplo `etapa1-correcciones`.
2. En esa rama (no en `main`): **Add file → Upload files** → subir `kocos-pipeline-etapa1-correcciones.zip` a la raíz → commit.
3. El flujo "Aplicar pipeline Kocos" descomprime el zip en la raíz, lo borra y guarda el commit en la misma rama.
4. Vercel arma una Preview de esa rama. Su build ya revisa los tipos y el lint con las dependencias reales:
   si algo fallara, la Preview queda en error y producción no cambia.

## Opción B — Parche exacto con git

```bash
git fetch origin
git checkout -b etapa1-correcciones 7c721bfae473b8d8a8bae1823c9d3a6bbd395540
git apply --check etapa1-correcciones-sobre-7c721bf.patch   # no debe decir nada
git apply --index etapa1-correcciones-sobre-7c721bf.patch
git commit -m "Etapa 1: correcciones de la revisión del 10/10 y guardado de originales"
git push -u origin etapa1-correcciones
```

El parche incluye los archivos binarios nuevos (íconos de la app instalable).

Comprobación de cualquiera de las dos opciones: en el commit que queda en la rama,
`git rev-parse HEAD^{tree}` tiene que dar el árbol indicado en `SHA256SUMS.txt`
(es el mismo para el parche, para el flujo "Aplicar pipeline Kocos" y para el paquete completo).

## Opción C — Compilar el paquete completo sin GitHub

```bash
mkdir legal-crm && cd legal-crm
unzip ../kocos-pipeline-etapa1-correcciones.zip
npm ci
```

## Comprobación con las dependencias reales

Desde la carpeta del proyecto, con Node 20 o superior (Vercel usa Node 24):

```bash
npm ci                                   # versiones exactas de package-lock.json
npm run build                            # build de Next.js (incluye su revisión de tipos y lint)
npm run typecheck                        # tipos de la aplicación (tsc --noEmit)
npx tsc -p tests/tsconfig.json --noEmit  # tipos de las pruebas
npm run lint
npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts
bash tests/integracion/correr.sh         # integración: necesita Docker
```

`npm run build` sin las variables de Supabase en la máquina: usar valores de relleno
(`NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=x`, `SUPABASE_SERVICE_ROLE_KEY=x`);
el build no se conecta a nada.

Para que GitHub lo haga solo en cada pull request o a pedido: crear con el editor web
`.github/workflows/verificar.yml` con el contenido de `docs/etapa1/ci/verificar.yml`. No viaja dentro del zip porque
el flujo "Aplicar pipeline Kocos" no puede crear flujos de trabajo (GitHub no se lo permite a su token).

Resultado esperado: 53 pruebas unitarias y 39 de integración, todas bien. Detalle en `tests/README.md`.

## Base de datos

- **0115, 0116 y 0117 ya están aplicadas en producción** (11/10). Son aditivas: la versión publicada hoy no las usa
  y sigue funcionando igual. La Preview las necesita porque usa la misma base.
- **`0199` no**: se aplica después de publicar en producción (hasta entonces la versión actual usa la clave pública).

## Preview

Preview usa **la base de producción** (datos reales). Para que funcione, agregar al alcance **Preview** en Vercel
(hoy están solo en Producción):

| Variable | Nota |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Antes del build de la Preview (se incorpora al compilar) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ídem |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensible |
| `ACCESS_PIN` | Sensible. El primer ingreso guarda el PIN en la base: vale también para producción |

No agregar `GEMINI_API_KEY` ni `CRON_SECRET` a Preview: así la IA y la tarea de campañas no pueden correr desde ahí.

Cuidado: las credenciales de WhatsApp de Civil y Penal ya están en Preview, así que **una respuesta manual desde Preview
sale de verdad**. No respondas a prospectos desde Preview. Meta manda los mensajes nuevos solo a producción: los
archivos que manda una persona se prueban después de publicar (`docs/etapa1/PRUEBA_TELEFONO.md`, paso 6).

Qué mirar en Preview:

1. Ingreso con el PIN.
2. Configuración → Pausa general: activa, sin aviso de problema de configuración.
3. Campañas → "BASE 21 9": pausada, 925 destinatarios, 725 en cola, 200 enviados; filtros "A revisar" y "En envío" en 0.
4. Inbox: conversaciones y mensajes como antes; el estado de entrega de los salientes se ve sin recargar.
5. Una ficha: texto para compartir con nombre, barrio y teléfono; el domicilio, si existe, solo como opción a elegir.
6. Revisión → "Archivos sin guardar": 0.

## Producción (después de Preview)

1. Llevar la rama a `main` (pull request y merge) o subir el mismo zip a `main`.
2. Avisame: reviso el despliegue, aplico `0199` y la reconciliación posterior.
3. La pausa general, los agentes, la tarea de campañas y "BASE 21 9" siguen como están: nada se reactiva solo.
