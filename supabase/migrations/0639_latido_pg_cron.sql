-- ---------------------------------------------------------------------
-- 0639 · El job del latido (pg_cron) queda versionado, sin el secreto (22/11)
--
-- Hasta hoy el job «campaigns-tick» existía solo en la base: si se perdía o
-- se tocaba, no había de dónde volver a crearlo, y su comando llevaba el
-- secreto escrito. Esta migración lo define de forma repetible:
--  - Cada minuto llama a /api/campaigns/tick con pg_net (tiempo máximo 55 s).
--  - El secreto NO está en este archivo ni en el repo: se lee en cada corrida
--    desde Supabase Vault, donde el secreto se llama «crm_cron_secret» (se
--    carga a mano, una sola vez, fuera del repo; ver docs/operacion-2211/MIGRACIONES.md).
--  - Si falta pg_cron, pg_net, Vault o el secreto, NO toca el job vigente
--    (queda como está) y avisa con un NOTICE. Nada se borra.
--  - Si el job ya existe con ese nombre, cron.schedule lo actualiza en el
--    lugar (mismo jobid, mismo historial de corridas).
--
-- La dirección del panel es la de producción; si cambia el dominio, se cambia
-- acá y se vuelve a aplicar.
-- ---------------------------------------------------------------------
set lock_timeout = '5s';

do $$
declare
  v_url constant text := 'https://legal-crm-nine.vercel.app/api/campaigns/tick';
  v_comando text;
begin
  if to_regclass('cron.job') is null then
    raise notice '0639: pg_cron no está habilitado; no se toca el latido.';
    return;
  end if;
  if to_regnamespace('net') is null then
    raise notice '0639: pg_net no está habilitado; no se toca el latido.';
    return;
  end if;
  if to_regclass('vault.decrypted_secrets') is null then
    raise notice '0639: Vault no está habilitado; no se toca el latido.';
    return;
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'crm_cron_secret') then
    raise notice '0639: falta el secreto «crm_cron_secret» en Vault; no se toca el latido vigente.';
    return;
  end if;

  -- Integración 22/11: cron.schedule actualiza en el lugar solo el job del MISMO usuario. Si el
  -- job vigente es de otro usuario, se crearía un segundo latido (doble corrida por minuto): no se toca.
  if exists (select 1 from cron.job where jobname = 'campaigns-tick' and username <> current_user) then
    raise notice '0639: el job campaigns-tick vigente es de otro usuario; no se toca (aplicar como ese usuario).';
    return;
  end if;

  -- El secreto se resuelve en cada corrida (no queda escrito en cron.job).
  v_comando := format(
    $cmd$select net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'crm_cron_secret' limit 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 55000
    );$cmd$,
    v_url
  );

  perform cron.schedule('campaigns-tick', '* * * * *', v_comando);
  raise notice '0639: job campaigns-tick definido (cada minuto, secreto desde Vault).';
end $$;
