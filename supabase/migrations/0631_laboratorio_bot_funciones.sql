-- ---------------------------------------------------------------------
-- 0631 · Laboratorio del bot (15/11): funciones.
--
-- 1) laboratorio_crear_version: crea la versión siguiente (v3, v4…) como
--    COPIA de otra en una sola transacción: fila nueva en
--    bot_knowledge_versions, copia de las fichas de la versión de origen
--    (las generales, las comunes y las de los perfiles elegidos) con el
--    número nuevo, las fichas nuevas, los datos propios en bot_lab_versiones
--    y una línea en ops_change_log. No modifica ninguna fila existente.
-- 2) laboratorio_estadisticas_ab: las mismas cifras que la comparación de
--    versiones (conocimiento_estadisticas), separadas por variante de una
--    prueba A/B. Solo lectura.
--
-- Repetible (create or replace). Sin permisos para anon ni authenticated.
-- Requiere la 0630.
-- ---------------------------------------------------------------------

create or replace function public.laboratorio_crear_version(
  p_nombre text,
  p_descripcion text,
  p_base smallint,
  p_rubros text[],
  p_modelo text,
  p_tono text,
  p_reglas text,
  p_roles jsonb,
  p_fichas jsonb,
  p_actor text
) returns smallint
language plpgsql
set search_path = public
as $$
declare
  v smallint;
begin
  -- Un número por vez, aunque dos personas creen versiones al mismo tiempo.
  perform pg_advisory_xact_lock(hashtext('bot_lab_crear_version'));
  if not exists (select 1 from bot_knowledge_versions where version = p_base) then
    raise exception 'La versión de origen no existe.';
  end if;
  select greatest(coalesce(max(version), 2) + 1, 3) into v from bot_knowledge_versions;
  if v > 99 then
    raise exception 'Se llegó al máximo de versiones (99).';
  end if;

  insert into bot_knowledge_versions (version, nombre, descripcion)
  values (v, left('v' || v || ' · ' || p_nombre, 80), left(coalesce(p_descripcion, ''), 1000));

  insert into bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden, updated_by)
  select v, i.clave, i.capa, i.rubro, i.titulo, i.disparadores, i.contenido, i.fuente, i.verificado_el, i.activo, i.orden, 'laboratorio'
    from bot_knowledge_items i
   where i.version = p_base
     and (i.rubro is null or i.rubro = 'comun' or i.rubro = any(p_rubros));

  insert into bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, activo, orden, updated_by)
  select v,
         'lab' || v || '-' || f.n,
         f.x ->> 'capa',
         f.x ->> 'rubro',
         f.x ->> 'titulo',
         coalesce(array(select jsonb_array_elements_text(f.x -> 'disparadores')), '{}'),
         f.x ->> 'contenido',
         'laboratorio v' || v,
         true,
         9000 + f.n,
         'laboratorio'
    from jsonb_array_elements(coalesce(p_fichas, '[]'::jsonb)) with ordinality as f(x, n);

  insert into bot_lab_versiones (version, base_version, rubros, modelo, tono, reglas, roles, creado_por)
  values (v, p_base, p_rubros, nullif(p_modelo, ''), coalesce(p_tono, ''), coalesce(p_reglas, ''), coalesce(p_roles, '[]'::jsonb), coalesce(p_actor, 'panel'));

  insert into ops_change_log (actor, action, target, before, after, note)
  values (
    coalesce(p_actor, 'panel'),
    'laboratorio_version_nueva',
    'bot_knowledge_versions:v' || v,
    null,
    jsonb_build_object('version', v, 'nombre', p_nombre, 'base_version', p_base, 'rubros', p_rubros, 'modelo', nullif(p_modelo, ''),
                       'tono', coalesce(p_tono, ''), 'reglas', coalesce(p_reglas, ''), 'roles', coalesce(p_roles, '[]'::jsonb),
                       'fichas_nuevas', jsonb_array_length(coalesce(p_fichas, '[]'::jsonb))),
    'Laboratorio del bot: versión nueva creada como copia. No rige hasta que se la aplique a mano.'
  );
  return v;
end;
$$;
revoke all on function public.laboratorio_crear_version(text, text, smallint, text[], text, text, text, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.laboratorio_crear_version(text, text, smallint, text[], text, text, text, jsonb, jsonb, text) to service_role;

create or replace function public.laboratorio_estadisticas_ab(p_prueba uuid)
returns table (
  variante text, conversaciones bigint, turnos bigint, siguieron bigint, captados bigint, escalados bigint,
  detenidos bigint, retenidos bigint, tokens_promedio numeric, latencia_promedio numeric
)
language sql stable
set search_path = public
as $$
  with p as (
    select id, inicio, least(coalesce(cortada_at, fin), fin) as hasta from bot_lab_pruebas_ab where id = p_prueba
  ), t as (
    select a.variante, l.conversation_id, l.created_at, l.herramientas, l.resultado, l.tokens_entrada, l.latencia_ms
      from p
      join bot_lab_ab_asignaciones a on a.prueba_id = p.id
      join agent_turn_logs l on l.conversation_id = a.conversation_id
     where l.created_at >= p.inicio and l.created_at < p.hasta
       and coalesce(l.uso, 'conversacion') = 'conversacion'
  ), c as (
    select t.variante, t.conversation_id, min(t.created_at) as primero,
           count(*) filter (where t.resultado = 'enviado') as turnos,
           bool_or('escalar_a_humano' = any(coalesce(t.herramientas, '{}'))) as escalado,
           count(*) filter (where t.resultado = 'retenido') as retenidos,
           avg(t.tokens_entrada) as tok, avg(t.latencia_ms) as lat
      from t group by t.variante, t.conversation_id
  ), x as (
    select c.*,
           exists (select 1 from messages m where m.conversation_id = c.conversation_id and m.direction = 'entrante' and m.created_at > c.primero) as siguio,
           exists (select 1 from opportunities o where o.conversation_id = c.conversation_id and o.captured_at >= c.primero) as captado,
           exists (select 1 from conversations cv join contact_detentions d on d.contact_id = cv.contact_id
                    where cv.id = c.conversation_id and d.created_at >= c.primero) as detenido
      from c
  )
  select x.variante, count(*), coalesce(sum(x.turnos), 0)::bigint, count(*) filter (where x.siguio),
         count(*) filter (where x.captado), count(*) filter (where x.escalado), count(*) filter (where x.detenido),
         coalesce(sum(x.retenidos), 0)::bigint, round(avg(x.tok)), round(avg(x.lat))
    from x group by x.variante;
$$;
revoke all on function public.laboratorio_estadisticas_ab(uuid) from public, anon, authenticated;
grant execute on function public.laboratorio_estadisticas_ab(uuid) to service_role;
