-- ---------------------------------------------------------------------
-- 0651 · Oficina: alcance de cada tarea (27/11, decisión del dueño)
--
-- «Se tiene que poder pedir una tarea para los 4 rubros juntos o
-- individuales, o mejoras al panel, etc. No tiene que limitar.»
--
-- Qué hace (solo agrega; no cambia ni borra datos):
--  1. bandeja_claude.rubro_id deja de ser obligatorio: una tarea conjunta
--     de varios rubros o una de «Todo el panel» no pertenece a un perfil.
--  2. bandeja_claude.alcance (jsonb): el alcance normalizado de
--     src/lib/alcance.ts ({tipo:'rubros', rubros:[...], modo} o
--     {tipo:'panel'}). Las filas viejas quedan en null y el panel las lee
--     como «un rubro» (el de rubro_id).
--  3. bandeja_claude.grupo_id: las tareas «por separado» (una por rubro)
--     comparten un grupo para ver el avance juntas.
--  4. Regla: una tarea sin rubro tiene que decir su alcance.
--
-- Rubros separados: una fila con rubro_id es de ese perfil y solo se ve ahí;
-- la conjunta y la del panel (rubro_id null) se ven solo en la Oficina.
--
-- Repetible (if not exists / bloques do). RLS y el trigger sin borrados de
-- la 0502 siguen igual. Sin permisos para anon ni authenticated.
--
-- Reversión (sin perder datos): primero copiar las filas con rubro_id null
-- a una tabla de respaldo; después «alter table bandeja_claude drop
-- constraint bandeja_claude_alcance_coherente, drop constraint
-- bandeja_claude_alcance_forma; drop index bandeja_claude_grupo_idx;» y
-- dejar las columnas (no molestan). Volver a poner rubro_id not null solo si
-- no quedan filas sin rubro.
-- ---------------------------------------------------------------------
set lock_timeout = '5s';

alter table public.bandeja_claude alter column rubro_id drop not null;
alter table public.bandeja_claude add column if not exists alcance jsonb;
alter table public.bandeja_claude add column if not exists grupo_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_alcance_forma') then
    alter table public.bandeja_claude add constraint bandeja_claude_alcance_forma
      check (
        alcance is null
        or (jsonb_typeof(alcance) = 'object' and alcance->>'tipo' in ('rubros', 'panel'))
      );
  end if;
  -- Sin rubro solo si el alcance lo explica (tarea conjunta o del panel).
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_alcance_coherente') then
    alter table public.bandeja_claude add constraint bandeja_claude_alcance_coherente
      check (rubro_id is not null or alcance is not null);
  end if;
end;
$$;

create index if not exists bandeja_claude_grupo_idx
  on public.bandeja_claude (grupo_id)
  where grupo_id is not null;

alter table public.bandeja_claude enable row level security;
revoke all on public.bandeja_claude from anon, authenticated;
