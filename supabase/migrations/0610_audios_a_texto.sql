-- 0610 · Audios pasados a texto (13/11).
-- La responsable pidió que el agente que responde entienda los audios.
-- El texto va en columnas propias del mensaje: el cuerpo («[Audio]») y el
-- original guardado no se tocan. Repetible. No borra nada. La tabla ya tiene
-- RLS y la clave pública no tiene permisos: no se agrega ninguno.

alter table public.messages
  add column if not exists audio_texto text,
  add column if not exists audio_texto_estado text,
  add column if not exists audio_texto_idioma text,
  add column if not exists audio_texto_detalle text,
  add column if not exists audio_texto_at timestamptz,
  add column if not exists audio_seg integer,
  add column if not exists audio_tokens integer,
  add column if not exists audio_ms integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_audio_texto_estado_check') then
    alter table public.messages
      add constraint messages_audio_texto_estado_check
      check (audio_texto_estado is null or audio_texto_estado in ('hecha', 'no_se_entiende', 'demasiado_largo', 'error'));
  end if;
end $$;

-- Para la cuenta de Salud («audios pasados a texto hoy / con error»).
create index if not exists messages_audio_texto_idx
  on public.messages (audio_texto_at desc)
  where audio_texto_estado is not null;

comment on column public.messages.audio_texto is 'Lo que dijo la persona en el audio, pasado a texto automáticamente. El cuerpo del mensaje no cambia.';
comment on column public.messages.audio_texto_estado is 'hecha | no_se_entiende | demasiado_largo | error. Null: no se intentó.';
