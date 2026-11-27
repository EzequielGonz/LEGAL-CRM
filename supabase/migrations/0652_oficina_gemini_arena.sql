-- ---------------------------------------------------------------------
-- 0652 · Oficina: «Que lo haga Gemini», repaso de Claude y modo arena (27/11)
--
-- Decisiones del dueño (27/11): Gemini ejecuta tareas de la Oficina SOLO
-- por botón, dentro del tope de USD 30 por mes compartido con los bots; lo
-- que hace queda «Hecho por Gemini · sin repasar» y no se aprueba hasta que
-- Claude lo repase. Cada tarea se resuelve con varias respuestas que compiten
-- y un juez elige la mejor («como la skill arena»).
--
-- Qué hace (solo agrega; no cambia ni borra datos):
--  1. bandeja_claude:
--     - ejecutor ('claude' | 'gemini'; null = todavía nadie).
--     - clase: qué tipo de trabajo es (texto, analisis, investigacion,
--       configuracion, codigo, publicacion, envio). Gemini nunca hace codigo,
--       publicacion ni envio.
--     - repaso ('sin_repasar' | 'repasada' | 'corregida'), repaso_nota,
--       repaso_at: el repaso de Claude sobre lo que hizo Gemini.
--     - resultado_gemini: copia intacta de lo que entregó Gemini (si Claude
--       corrige, reescribe «resultado» y esto queda: nada se pisa).
--     - arena (jsonb): candidatos, puntajes, ganador y por qué ganó.
--     - arena_candidatos: cuántas respuestas compiten en esta tarea (1 a 101).
--     - costo_usd, intentos, ultimo_error.
--  2. agent_turn_logs:
--     - uso admite 'oficina' (se conservan todos los valores que ya tenga la
--       restricción, también 'cerebro' si la 0657 ya corrió).
--     - bandeja_id: a qué tarea de la Oficina corresponde el gasto.
--  3. Índices parciales para la cola de repaso y la mesa de entrada.
--
-- Repetible. RLS sin cambios y sin permisos para anon ni authenticated.
--
-- Reversión (sin perder datos): copiar las columnas nuevas a un respaldo y
-- soltar las restricciones e índices nuevos; para el uso, recrear el CHECK
-- sin 'oficina' solo si no quedan filas con ese uso (si quedan, se dejan).
-- ---------------------------------------------------------------------
set lock_timeout = '5s';

-- 1) bandeja_claude ----------------------------------------------------
alter table public.bandeja_claude add column if not exists ejecutor text;
alter table public.bandeja_claude add column if not exists clase text;
alter table public.bandeja_claude add column if not exists repaso text;
alter table public.bandeja_claude add column if not exists repaso_nota text;
alter table public.bandeja_claude add column if not exists repaso_at timestamptz;
alter table public.bandeja_claude add column if not exists resultado_gemini text;
alter table public.bandeja_claude add column if not exists arena jsonb;
alter table public.bandeja_claude add column if not exists arena_candidatos smallint;
alter table public.bandeja_claude add column if not exists costo_usd numeric(10, 4) not null default 0;
alter table public.bandeja_claude add column if not exists intentos smallint not null default 0;
alter table public.bandeja_claude add column if not exists ultimo_error text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_ejecutor_valido') then
    alter table public.bandeja_claude add constraint bandeja_claude_ejecutor_valido
      check (ejecutor is null or ejecutor in ('claude', 'gemini'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_clase_valida') then
    alter table public.bandeja_claude add constraint bandeja_claude_clase_valida
      check (clase is null or clase in ('texto', 'analisis', 'investigacion', 'configuracion', 'codigo', 'publicacion', 'envio'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_repaso_valido') then
    alter table public.bandeja_claude add constraint bandeja_claude_repaso_valido
      check (repaso is null or repaso in ('sin_repasar', 'repasada', 'corregida'));
  end if;
  -- Solo se repasa lo que hizo alguien.
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_repaso_con_ejecutor') then
    alter table public.bandeja_claude add constraint bandeja_claude_repaso_con_ejecutor
      check (repaso is null or ejecutor is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_arena_forma') then
    alter table public.bandeja_claude add constraint bandeja_claude_arena_forma
      check (arena is null or jsonb_typeof(arena) = 'object');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_arena_candidatos_rango') then
    alter table public.bandeja_claude add constraint bandeja_claude_arena_candidatos_rango
      check (arena_candidatos is null or arena_candidatos between 1 and 101);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_costo_positivo') then
    alter table public.bandeja_claude add constraint bandeja_claude_costo_positivo
      check (costo_usd >= 0 and intentos >= 0);
  end if;
end;
$$;

-- Cola «Para repasar»: lo que hizo Gemini y Claude todavía no miró.
create index if not exists bandeja_claude_repaso_idx
  on public.bandeja_claude (updated_at)
  where ejecutor = 'gemini' and repaso = 'sin_repasar';

-- Mesa de entrada: lo que espera ejecutor.
create index if not exists bandeja_claude_entrada_idx
  on public.bandeja_claude (created_at)
  where estado in ('pendiente', 'en_espera');

-- 2) agent_turn_logs -----------------------------------------------------
alter table public.agent_turn_logs add column if not exists bandeja_id uuid references public.bandeja_claude(id);

create index if not exists agent_turn_logs_bandeja_idx
  on public.agent_turn_logs (bandeja_id)
  where bandeja_id is not null;

-- uso 'oficina': se lee la restricción actual, se le suma el valor y se
-- recrea con TODOS los valores que ya tenía (así no se pisa con la del
-- Cerebro, que suma 'cerebro' con la misma técnica).
do $$
declare
  v_nombre text;
  v_def text;
  v_valores text[];
  v_lista text;
begin
  select c.conname, pg_get_constraintdef(c.oid) into v_nombre, v_def
    from pg_constraint c
   where c.conrelid = 'public.agent_turn_logs'::regclass
     and c.contype = 'c'
     and pg_get_constraintdef(c.oid) ~* '\muso\M'
   limit 1;

  if v_def is not null and v_def ilike '%''oficina''%' then
    return; -- ya está
  end if;

  v_valores := array['conversacion', 'analisis', 'evaluacion_plantillas', 'recontacto'];
  if v_def is not null then
    select coalesce(array_agg(distinct m[1]), array[]::text[]) into v_valores
      from regexp_matches(v_def, '''([a-z_]+)''', 'g') as m;
    v_valores := array(select distinct unnest(v_valores || array['conversacion', 'analisis', 'evaluacion_plantillas', 'recontacto']));
  end if;
  v_valores := array(select distinct unnest(v_valores || array['oficina']) order by 1);

  select string_agg(quote_literal(x), ', ') into v_lista from unnest(v_valores) as x;

  if v_nombre is not null then
    execute format('alter table public.agent_turn_logs drop constraint %I', v_nombre);
  end if;
  execute format('alter table public.agent_turn_logs add constraint agent_turn_logs_uso_check check (uso in (%s))', v_lista);
end;
$$;
