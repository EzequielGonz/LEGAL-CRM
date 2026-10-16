# Etapa 2 · Entrega 1 corregida y verificada: bloques 2.0 y 2.3

Fecha: 13/10/2026. Base: rama `main` en `fb5cdc3` (producción desde el 11/10, árbol `0dfdc2e`). **Reemplaza a la entrega 1 del 12/10 y a la entrega corregida anterior** (ZIP con huella `a4b44b1c…`). Si todavía no subiste ninguna, subí solo esta; si ya subiste alguna a la rama `etapa2`, subí esta encima.

| Archivo | Para qué |
| --- | --- |
| `kocos-pipeline-etapa2-entrega1-verificada.zip` | **Proyecto completo**: todos los archivos de `fb5cdc3` con los bloques 2.0 y 2.3 corregidos (sin `node_modules`, `.next` ni `.github`). Se aplica con el flujo «Aplicar pipeline Kocos» |
| `etapa2-entrega1-verificada-sobre-fb5cdc3.patch` | Los mismos cambios como diferencia exacta sobre `fb5cdc3`, para `git apply` |
| `SHA256SUMS.txt` | Huellas para comprobar que los archivos llegaron completos |

## Correcciones de esta versión (revisión del 13/10)

1. **Línea de otro perfil.** El seguimiento solo sale por una línea del perfil de la tarea y del área de la conversación. Si la conversación tiene línea, se usa esa o ninguna: una línea de otro perfil, de otra área o desactivada deja la tarea pendiente, con el motivo a la vista, antes de elegir plantilla y credenciales. La compuerta de la base repite la comprobación y además exige que conversación, contacto y oportunidad sean los de la tarea.
2. **Hora al enviar.** La hora y el calendario se vuelven a leer después de las consultas y antes de reservar la tarea, y la hora y el plazo se comprueban otra vez justo antes de llamar a Meta. Si dejaron de valer, la tarea se reprograma dentro del mismo plazo de 72 horas (o queda como conflicto) sin gastar un intento.
3. **Candidatas.** Las interrupciones anteriores a la activación, las de más de 72 horas y las ya descartadas no vuelven a la lista; el planificador la recorre por páginas (200 por página, hasta 10 páginas por vuelta). Nada histórico se reactiva y las reglas del circuito no cambian.

**Verificación con las dependencias reales.** En un entorno aislado de Vercel, con `npm ci` y Node 24 como el proyecto, pasaron los tipos de la aplicación y de las pruebas, el lint, la compilación de Next.js, las 73 pruebas unitarias y las 53 de integración con el cliente real de Supabase. Para eso se ajustó una prueba de adjuntos de la Etapa 1 que comparaba la dirección de descarga letra por letra; la aplicación no cambia. Detalle en `INFORME.md`.

## Qué incluye

- **2.0 Reglas de contacto y calendario.** Todo envío automático (campañas y seguimiento) respeta lunes a sábado de 8 a 21, hora de Argentina, aunque sea feriado, y nunca domingo. En Configuración se cargan a mano excepciones: un día cerrado o un horario más corto, nunca más amplio. Si el calendario no se puede leer, no se envía.
- **2.3 Seguimiento general.** Un solo circuito para los cuatro perfiles: contacto 2 solo para quien respondió y se interrumpió; contacto 3 solo si respondió al 2 y volvió a interrumpirse; espera inicial de 60 horas dentro de 48 a 72, en una franja válida; conflicto visible si no hay franja, sin ampliar el plazo; después del contacto 3 sin avance, base para campaña manual que no envía nada. Queda **apagado en los cuatro perfiles** y se activa por perfil con el PIN. Marketing pasa a este circuito y su repesca anterior queda como historial.

No incluye todavía: 2.1, 2.2 y 2.4 a 2.9, ni las ampliaciones del parche del 12/10.

## Cómo aplicarla (primero en Preview)

1. **Rama.** En GitHub (`EzequielGonz/LEGAL-CRM`), si no existe, abrí el selector de ramas, escribí `etapa2` y elegí «Create branch etapa2 from main».
2. **Subí el ZIP a esa rama** (Add file → Upload files, con `etapa2` elegida). El flujo «Aplicar pipeline Kocos» lo descomprime y guarda el commit «Aplicar pipeline de Marketing». Vercel arma la Preview de esa rama y compila con las dependencias reales. La misma compilación ya terminó bien en el entorno aislado, pero **antes de seguir, comprobamos que esta también termine bien**.
3. **Migraciones en Supabase** (SQL Editor), en este orden y cada archivo completo:
   1. Si todavía no la aplicaste: `0199_etapa1_cierre_rls.sql` y después `select public.etapa1_reconciliar_posteriores();`
   2. `0200_etapa2_calendario.sql`
   3. `0201_etapa2_seguimiento.sql`

   Al 13/10 ninguna está aplicada en producción. Si alguna vez aplicaste la 0201 de la entrega anterior, corré igual esta: reemplaza tres funciones, agrega una y no toca datos. Las tres migraciones se pueden aplicar con la versión publicada funcionando (ver `MIGRACIONES.md`).
4. **Revisá la Preview solo mirando.** Usa la misma base y las mismas líneas que producción: no cargues excepciones, no actives el seguimiento ni generes bases de repesca ahí.
   - Ingresás con el PIN.
   - Configuración → «Horario de contacto y calendario (todos los perfiles)»: horario general y lista vacía.
   - «Seguimiento» (menú general y de cada perfil): apagado, 60 horas, sin tareas.
   - Marketing → Seguimiento: el historial de la repesca anterior aparece plegado.
   - Campañas: «BASE 21 9» sigue pausada, con 725 en cola.
5. **Producción.** Abrí el pull request de `etapa2` a `main` y hacé el merge. Cuando Vercel publique, repetí la lista del paso 4 en `legal-crm-nine.vercel.app`.

Nada se activa solo: siguen la pausa general, los agentes apagados, la tarea de campañas inactiva, «BASE 21 9» pausada y el seguimiento apagado en los cuatro perfiles.

## Reversión

- **Panel:** en Vercel, «Instant Rollback» al despliegue de `fb5cdc3`, o revertir el merge en GitHub.
- **Base:** 0200 y 0201 pueden quedar, porque la versión anterior funciona igual con ellas. Si querés quitarlas, `docs/etapa2/revertir_0200_0201.sql` lo hace solo si no hay datos nuevos; si los hay, se detiene sin tocar nada.
