# Migraciones 0638 y 0639 · cómo aplicar y revertir

Ninguna está aplicada. Orden: primero 0638, después 0639. Ambas son repetibles, aditivas, sin borrados de datos y sin permisos para la clave pública. Para el proyecto de Supabase `enhgkeqiqcuwafsedaza`.

## 0638 · `0638_gasto_gemini_tope.sql`

Hace tres cosas:
1. Reemplaza la restricción `agent_turn_logs_uso_check` por otra que acepta también `'recontacto'` (los datos existentes no cambian).
2. Crea el índice `agent_turn_logs_rubro_fecha_idx (rubro_id, created_at)`.
3. Crea la función de solo lectura `public.gasto_gemini_resumen(p_desde_dia, p_desde_mes)` (`security definer`, `search_path = public`, ejecutable solo por `service_role`).

**Aplicar:** ejecutar el archivo completo (conector de Supabase o `supabase db push`).

**Comprobar:**
```sql
select conname, pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.agent_turn_logs'::regclass and conname = 'agent_turn_logs_uso_check';
select * from public.gasto_gemini_resumen(date_trunc('day', now()), date_trunc('month', now()));
```

**Revertir** (sin tocar datos; el panel anterior no usa nada de esto):
```sql
drop function if exists public.gasto_gemini_resumen(timestamptz, timestamptz);
drop index if exists public.agent_turn_logs_rubro_fecha_idx;
-- La restricción puede quedar con 'recontacto': es inocua. Si hace falta volver a la anterior,
-- primero comprobar que no hay filas con uso = 'recontacto' (no se borran: se recodifican a otro valor permitido solo si el dueño lo decide).
```

**Si el panel nuevo se publica sin aplicar 0638:** el bot sigue funcionando (la lectura del gasto falla, se registra el error y el tope no actúa), pero el recontacto fallaría al registrar su turno con `uso = 'recontacto'` (el registro de turnos nunca interrumpe; solo se pierde ese registro). Por eso conviene aplicar 0638 antes de publicar.

### Configurar el presupuesto (opcional; sin esto rigen los valores por defecto)

```sql
insert into system_settings (key, value)
values ('presupuesto_gemini', '{"mensualUsd": 30, "avisoFraccion": 0.8, "topeDiarioPorPerfilUsd": 0.4, "precioEntradaMillon": 0.3, "precioSalidaMillon": 2.5, "frenar": true, "frenoDiario": false}'::jsonb)
on conflict (key) do update set value = excluded.value;
```
Para apagar el freno y solo medir y avisar: `"frenar": false`. El tope **diario** por perfil es solo aviso por defecto (`"frenoDiario": false`, pedido de Dirección del 22/11: los precios por token son estimados); para que también corte al bot: `"frenoDiario": true`. El tope del **mes** frena siempre que `frenar` esté en `true`. Para volver a los valores por defecto: reemplazar el valor de esa fila con `{}` (es una configuración; no se borra la fila).

## 0639 · `0639_latido_pg_cron.sql`

Define el job `campaigns-tick` de `pg_cron` (cada minuto, `pg_net`, 55 s de tiempo máximo). **El secreto no está en el archivo**: se resuelve en cada corrida desde Supabase Vault.

**Antes de aplicar (una sola vez, a mano, quien administra; el valor es el mismo `CRON_SECRET` de Vercel y no se escribe en ningún archivo ni chat):**
```sql
select vault.create_secret('<VALOR DE CRON_SECRET>', 'crm_cron_secret', 'Secreto del latido /api/campaigns/tick');
```
(Si ya existe: `select vault.update_secret(id, '<nuevo valor>') from vault.secrets where name = 'crm_cron_secret';`.)

**Aplicar:** ejecutar el archivo. Si falta pg_cron, pg_net, Vault o el secreto, **no toca el job vigente** y emite un `NOTICE` explicando qué falta. Si el job ya existe, se actualiza en el lugar (mismo `jobid`).

**Comprobar** (sin mostrar el secreto):
```sql
select jobid, jobname, schedule, active,
       command like '%vault.decrypted_secrets%' as secreto_desde_vault,
       command not like '%Bearer %' as sin_secreto_escrito
  from cron.job where jobname = 'campaigns-tick';
select status, count(*) from cron.job_run_details
 where jobid = (select jobid from cron.job where jobname = 'campaigns-tick') and start_time > now() - interval '10 minutes'
 group by 1;
-- Último latido registrado por el panel:
select value->>'at' as ultimo, value->>'ok' as ok, value->'hueco' as hueco_reciente from system_settings where key = 'ultimo_latido';
```
Después de aplicar, esperar 2 minutos y confirmar que `ultimo_latido` avanza (si no, el job no llega al panel: revisar el secreto en Vault).

**Revertir:** volver a la definición anterior (con el secreto escrito en el comando) **solo** si el latido no funciona con Vault y mientras se arregla; el secreto se pega en la consola de Supabase, nunca en el repo:
```sql
select cron.schedule('campaigns-tick', '* * * * *',
  $$select net.http_post(url := 'https://legal-crm-nine.vercel.app/api/campaigns/tick',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <CRON_SECRET>"}'::jsonb,
      body := '{}'::jsonb, timeout_milliseconds := 55000);$$);
```
Para pausar el latido por completo (no recomendado: frena campañas, seguimientos y recontacto): `select cron.unschedule('campaigns-tick');`.

## Orden recomendado de publicación

1. Cargar el secreto en Vault (0639, paso previo).
2. Aplicar 0638 y 0639.
3. Publicar la rama (el panel con el tope y los tiempos máximos).
4. Mirar Salud: latido en verde, «Gasto de IA del mes» y el tiempo de la etapa «campañas».
