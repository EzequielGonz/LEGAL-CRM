-- ---------------------------------------------------------------------
-- 0632 · Laboratorio del bot (15/11, revisión cruzada): cada aplicación,
-- cada vuelta atrás y cada prueba A/B en UNA transacción junto con su línea
-- en ops_change_log. Si algo falla, no queda nada a medias.
--
--   laboratorio_aplicar_version   versión del laboratorio a todo un perfil
--   laboratorio_aplicar_rol       rol a perfil, tipo de consulta, base o campaña
--   laboratorio_revertir          vuelve a lo anterior (sin pisar cambios hechos después)
--   laboratorio_crear_ab          prueba A/B con candado por campaña (nunca dos vigentes)
--   laboratorio_cortar_ab         corta una prueba A/B
--
-- Los errores esperables salen con `raise exception` (código P0001) y un
-- texto para mostrar en el panel. Solo inserta o actualiza filas del
-- laboratorio, de bot_knowledge_assignment y agent_role_id de una base o
-- campaña (lo mismo que ya hacen Perfiles y Agentes), siempre con su registro.
-- Nada se borra. create or replace: repetible. Requiere 0630 y 0631.
-- Sin ejecución para public, anon ni authenticated.
-- ---------------------------------------------------------------------

create or replace function public.laboratorio_aplicar_version(p_rubro text, p_version smallint, p_actor text)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_cfg bot_lab_versiones%rowtype;
  v_antes bot_knowledge_assignment%rowtype;
  v_hay_antes boolean;
  v_despues jsonb;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('bot_lab_asignacion:' || p_rubro));
  select * into v_cfg from bot_lab_versiones where version = p_version;
  if not found then
    raise exception 'Desde el laboratorio se aplican versiones creadas acá (v3 en adelante). Para v1 o v2 usá «Conocimiento del bot».';
  end if;
  if v_cfg.archived_at is not null then
    raise exception 'La versión está archivada.';
  end if;
  if not (p_rubro = any(v_cfg.rubros)) then
    raise exception 'Esa versión no se creó para este perfil.';
  end if;
  select * into v_antes from bot_knowledge_assignment where rubro = p_rubro for update;
  v_hay_antes := found;
  if v_hay_antes and v_antes.version = p_version and v_antes.comparar_con is null then
    raise exception 'v% ya rige en este perfil.', p_version;
  end if;
  insert into bot_knowledge_assignment (rubro, version, comparar_con, porcentaje, desde, updated_by)
  values (p_rubro, p_version, null, 100, now(), p_actor)
  on conflict (rubro) do update set version = excluded.version, comparar_con = null, porcentaje = 100, desde = now(), updated_by = excluded.updated_by;
  v_despues := jsonb_build_object('rubro', p_rubro, 'version', p_version, 'comparar_con', null, 'porcentaje', 100);
  insert into bot_lab_aplicaciones (tipo, rubro, version, antes, despues, aplicada_por)
  values ('version_perfil', p_rubro, p_version, case when v_hay_antes then to_jsonb(v_antes) else null end, v_despues, p_actor)
  returning id into v_id;
  insert into ops_change_log (actor, action, target, before, after, note)
  values (p_actor, 'laboratorio_aplicar_version', 'bot_knowledge_assignment:' || p_rubro,
          case when v_hay_antes then to_jsonb(v_antes) else null end, v_despues || jsonb_build_object('aplicacion', v_id),
          'Laboratorio: versión aplicada a todo el perfil, a mano y con confirmación. Se puede volver atrás.');
  return v_id;
end;
$$;

create or replace function public.laboratorio_aplicar_rol(
  p_tipo text, p_rubro text, p_rubro_id uuid, p_areas text[], p_rol uuid, p_tipo_consulta text, p_base uuid, p_campana uuid, p_actor text
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
  v_antes uuid;
  v_area text;
begin
  if p_tipo not in ('rol_perfil', 'rol_tipo_consulta', 'rol_base', 'rol_campana') then
    raise exception 'Destino no válido.';
  end if;
  if p_rol is not null and not exists (select 1 from agent_roles where id = p_rol and rubro_id = p_rubro_id and archived_at is null) then
    raise exception 'El rol no es de este perfil o está archivado.';
  end if;
  if p_tipo in ('rol_perfil', 'rol_tipo_consulta') then
    if p_rol is null then
      raise exception 'Elegí un rol.';
    end if;
    perform pg_advisory_xact_lock(hashtext('bot_lab_rol:' || p_rubro));
    if p_tipo = 'rol_perfil' and exists (select 1 from bot_lab_aplicaciones where tipo = 'rol_perfil' and rubro = p_rubro and revertida_at is null) then
      raise exception 'Ya hay un rol aplicado a todo el perfil. Volvé atrás el anterior antes de aplicar otro.';
    end if;
    if p_tipo = 'rol_tipo_consulta' and exists (select 1 from bot_lab_aplicaciones where tipo = 'rol_tipo_consulta' and rubro = p_rubro and tipo_consulta = p_tipo_consulta and revertida_at is null) then
      raise exception 'Ya hay un rol aplicado a ese tipo de consulta. Volvé atrás el anterior antes de aplicar otro.';
    end if;
    insert into bot_lab_aplicaciones (tipo, rubro, rol_id, tipo_consulta, antes, despues, aplicada_por)
    values (p_tipo, p_rubro, p_rol, case when p_tipo = 'rol_tipo_consulta' then p_tipo_consulta end, null,
            jsonb_build_object('rol_id', p_rol, 'tipo_consulta', case when p_tipo = 'rol_tipo_consulta' then p_tipo_consulta end), p_actor)
    returning id into v_id;
    insert into ops_change_log (actor, action, target, before, after, note)
    values (p_actor, 'laboratorio_aplicar_rol', 'bot_lab_aplicaciones:' || v_id, null,
            jsonb_build_object('tipo', p_tipo, 'rubro', p_rubro, 'rol_id', p_rol, 'tipo_consulta', p_tipo_consulta),
            'Laboratorio: rol aplicado a mano. Entra solo si la charla no tiene rol de campaña ni de base.');
  elsif p_tipo = 'rol_base' then
    select agent_role_id, area::text into v_antes, v_area from imported_bases where id = p_base for update;
    if not found or not (v_area = any(p_areas)) then
      raise exception 'La base no es de este perfil.';
    end if;
    update imported_bases set agent_role_id = p_rol where id = p_base;
    insert into bot_lab_aplicaciones (tipo, rubro, rol_id, base_id, antes, despues, aplicada_por)
    values ('rol_base', p_rubro, p_rol, p_base, jsonb_build_object('agent_role_id', v_antes), jsonb_build_object('agent_role_id', p_rol), p_actor)
    returning id into v_id;
    insert into ops_change_log (actor, action, target, before, after, note)
    values (p_actor, 'laboratorio_aplicar_rol', 'imported_bases:' || p_base, jsonb_build_object('agent_role_id', v_antes),
            jsonb_build_object('agent_role_id', p_rol, 'aplicacion', v_id), 'Laboratorio: rol cargado a una base. Se puede volver atrás.');
  else
    select agent_role_id, area::text into v_antes, v_area from campaigns where id = p_campana for update;
    if not found or not (v_area = any(p_areas)) then
      raise exception 'La campaña no es de este perfil.';
    end if;
    update campaigns set agent_role_id = p_rol where id = p_campana;
    insert into bot_lab_aplicaciones (tipo, rubro, rol_id, campaign_id, antes, despues, aplicada_por)
    values ('rol_campana', p_rubro, p_rol, p_campana, jsonb_build_object('agent_role_id', v_antes), jsonb_build_object('agent_role_id', p_rol), p_actor)
    returning id into v_id;
    insert into ops_change_log (actor, action, target, before, after, note)
    values (p_actor, 'laboratorio_aplicar_rol', 'campaigns:' || p_campana, jsonb_build_object('agent_role_id', v_antes),
            jsonb_build_object('agent_role_id', p_rol, 'aplicacion', v_id), 'Laboratorio: rol cargado a una campaña. Se puede volver atrás.');
  end if;
  return v_id;
end;
$$;

create or replace function public.laboratorio_revertir(p_id uuid, p_rubro_id uuid, p_areas text[], p_actor text, p_nota text)
returns void
language plpgsql
set search_path = public
as $$
declare
  a bot_lab_aplicaciones%rowtype;
  v_actual bot_knowledge_assignment%rowtype;
  v_previo uuid;
  v_ahora uuid;
  v_area text;
begin
  select * into a from bot_lab_aplicaciones where id = p_id for update;
  if not found then
    raise exception 'No existe esa aplicación.';
  end if;
  if a.revertida_at is not null then
    raise exception 'Ya se volvió atrás.';
  end if;
  if a.tipo = 'version_perfil' then
    perform pg_advisory_xact_lock(hashtext('bot_lab_asignacion:' || a.rubro));
    select * into v_actual from bot_knowledge_assignment where rubro = a.rubro for update;
    if not found or v_actual.version <> a.version or v_actual.comparar_con is not null then
      raise exception 'La versión del perfil cambió después de esta aplicación. Revisala en «Conocimiento del bot» antes de volver atrás.';
    end if;
    if a.antes is not null and exists (
      select 1 from bot_lab_versiones lv
       where lv.archived_at is not null
         and lv.version in (nullif(a.antes ->> 'version', '')::smallint, nullif(a.antes ->> 'comparar_con', '')::smallint)
    ) then
      raise exception 'La versión que regía antes quedó archivada: no se vuelve a ella. Elegí la versión en «Conocimiento del bot».';
    end if;
    if a.antes is null then
      -- No había fila: regía la versión por defecto (v2, ver versionParaConversacion en
      -- src/lib/conocimiento/seleccion.ts). No se borra la fila: se deja v2 sola, mismo efecto.
      update bot_knowledge_assignment set version = 2, comparar_con = null, porcentaje = 100, desde = now(), updated_by = p_actor where rubro = a.rubro;
    else
      update bot_knowledge_assignment
         set version = (a.antes ->> 'version')::smallint,
             comparar_con = nullif(a.antes ->> 'comparar_con', '')::smallint,
             porcentaje = coalesce((a.antes ->> 'porcentaje')::smallint, 100),
             desde = now(), updated_by = p_actor
       where rubro = a.rubro;
    end if;
    insert into ops_change_log (actor, action, target, before, after, note)
    select p_actor, 'laboratorio_volver_atras', 'bot_knowledge_assignment:' || a.rubro, to_jsonb(v_actual), to_jsonb(k),
           'Laboratorio: vuelve a lo anterior (aplicación ' || p_id || ').' || case when a.antes is null then ' No había fila previa: queda la versión por defecto (v2).' else '' end
      from bot_knowledge_assignment k where k.rubro = a.rubro;
  elsif a.tipo in ('rol_base', 'rol_campana') then
    v_previo := nullif(a.antes ->> 'agent_role_id', '')::uuid;
    if v_previo is not null and not exists (select 1 from agent_roles where id = v_previo and rubro_id = p_rubro_id and archived_at is null) then
      raise exception 'El rol que había antes ya no está disponible (archivado o de otro perfil). Elegí el rol a mano.';
    end if;
    if a.tipo = 'rol_base' then
      select agent_role_id, area::text into v_ahora, v_area from imported_bases where id = a.base_id for update;
    else
      select agent_role_id, area::text into v_ahora, v_area from campaigns where id = a.campaign_id for update;
    end if;
    if not found or not (v_area = any(p_areas)) then
      raise exception 'La base o campaña ya no es de este perfil.';
    end if;
    if v_ahora is distinct from nullif(a.despues ->> 'agent_role_id', '')::uuid then
      raise exception 'El rol cambió después de esta aplicación. Revisalo a mano antes de volver atrás.';
    end if;
    if a.tipo = 'rol_base' then
      update imported_bases set agent_role_id = v_previo where id = a.base_id;
    else
      update campaigns set agent_role_id = v_previo where id = a.campaign_id;
    end if;
    insert into ops_change_log (actor, action, target, before, after, note)
    values (p_actor, 'laboratorio_volver_atras', case when a.tipo = 'rol_base' then 'imported_bases:' || a.base_id else 'campaigns:' || a.campaign_id end,
            jsonb_build_object('agent_role_id', v_ahora), jsonb_build_object('agent_role_id', v_previo),
            'Laboratorio: vuelve a lo anterior (aplicación ' || p_id || ').');
  else
    insert into ops_change_log (actor, action, target, before, after, note)
    values (p_actor, 'laboratorio_volver_atras', 'bot_lab_aplicaciones:' || p_id,
            jsonb_build_object('tipo', a.tipo, 'rol_id', a.rol_id, 'tipo_consulta', a.tipo_consulta), null,
            'Laboratorio: se quita el rol aplicado; vuelve el comportamiento anterior.');
  end if;
  update bot_lab_aplicaciones set revertida_at = now(), revertida_por = p_actor, nota_reversion = nullif(left(coalesce(p_nota, ''), 300), '') where id = p_id;
end;
$$;

create or replace function public.laboratorio_crear_ab(
  p_rubro text, p_campana uuid, p_areas text[], p_version smallint, p_modelo text, p_porcentaje smallint, p_dias smallint, p_actor text
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
  v_area text;
  v_control smallint;
  v_fila jsonb;
begin
  -- Candado por campaña: dos pedidos a la vez no pueden dejar dos pruebas vigentes.
  perform pg_advisory_xact_lock(hashtext('bot_lab_ab:' || p_campana));
  select area::text into v_area from campaigns where id = p_campana and archived_at is null;
  if not found or not (v_area = any(p_areas)) then
    raise exception 'La campaña no es de este perfil o está archivada.';
  end if;
  if exists (select 1 from bot_lab_pruebas_ab where campaign_id = p_campana and cortada_at is null and fin > now()) then
    raise exception 'Esta campaña ya tiene una prueba A/B en curso. Cortala antes de armar otra.';
  end if;
  if exists (select 1 from bot_lab_versiones where version = p_version and (archived_at is not null or not (p_rubro = any(rubros)))) then
    raise exception 'Esa versión está archivada o no se creó para este perfil.';
  end if;
  select coalesce((select version from bot_knowledge_assignment where rubro = p_rubro), 2) into v_control;
  if v_control = p_version and nullif(p_modelo, '') is null then
    raise exception 'La prueba tiene que cambiar algo: otra versión u otro modelo.';
  end if;
  insert into bot_lab_pruebas_ab (rubro, campaign_id, version, modelo, porcentaje, dias, inicio, fin, control_version, creada_por)
  values (p_rubro, p_campana, p_version, nullif(p_modelo, ''), p_porcentaje, p_dias, now(), now() + make_interval(days => p_dias), v_control, p_actor)
  returning id into v_id;
  select to_jsonb(p) into v_fila from bot_lab_pruebas_ab p where p.id = v_id;
  insert into ops_change_log (actor, action, target, before, after, note)
  values (p_actor, 'laboratorio_ab_inicio', 'bot_lab_pruebas_ab:' || v_id, null, v_fila,
          'Laboratorio: prueba A/B en una campaña, solo para charlas nuevas. Se corta sola al vencer.');
  return v_id;
end;
$$;

create or replace function public.laboratorio_cortar_ab(p_id uuid, p_actor text, p_nota text)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_fin timestamptz;
  v_cortada timestamptz;
begin
  select fin, cortada_at into v_fin, v_cortada from bot_lab_pruebas_ab where id = p_id for update;
  if not found then
    raise exception 'No existe esa prueba.';
  end if;
  if v_cortada is not null then
    raise exception 'La prueba ya estaba cortada.';
  end if;
  update bot_lab_pruebas_ab set cortada_at = now(), cortada_por = p_actor, nota_corte = nullif(left(coalesce(p_nota, ''), 300), '') where id = p_id;
  insert into ops_change_log (actor, action, target, before, after, note)
  values (p_actor, 'laboratorio_ab_corte', 'bot_lab_pruebas_ab:' || p_id, jsonb_build_object('cortada_at', null, 'fin', v_fin),
          jsonb_build_object('cortada_at', now()), 'Laboratorio: prueba A/B cortada a mano; todas las charlas vuelven a la versión activa.');
end;
$$;

revoke all on function public.laboratorio_aplicar_version(text, smallint, text) from public, anon, authenticated;
revoke all on function public.laboratorio_aplicar_rol(text, text, uuid, text[], uuid, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.laboratorio_revertir(uuid, uuid, text[], text, text) from public, anon, authenticated;
revoke all on function public.laboratorio_crear_ab(text, uuid, text[], smallint, text, smallint, smallint, text) from public, anon, authenticated;
revoke all on function public.laboratorio_cortar_ab(uuid, text, text) from public, anon, authenticated;
grant execute on function public.laboratorio_aplicar_version(text, smallint, text) to service_role;
grant execute on function public.laboratorio_aplicar_rol(text, text, uuid, text[], uuid, text, uuid, uuid, text) to service_role;
grant execute on function public.laboratorio_revertir(uuid, uuid, text[], text, text) to service_role;
grant execute on function public.laboratorio_crear_ab(text, uuid, text[], smallint, text, smallint, smallint, text) to service_role;
grant execute on function public.laboratorio_cortar_ab(uuid, text, text) to service_role;
