-- =====================================================================
-- RLS: el panel opera con la service_role key desde el servidor (API
-- routes de Next.js), así que estas políticas son una segunda barrera
-- por si algún día se agrega acceso directo desde el cliente.
-- Todo admin autenticado (fila en admin_profiles) puede leer/escribir.
-- =====================================================================

alter table studios enable row level security;
alter table channels enable row level security;
alter table contacts enable row level security;
alter table contact_identities enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table availability_rules enable row level security;
alter table availability_blocks enable row level security;
alter table appointments enable row level security;
alter table campaigns enable row level security;
alter table campaign_contacts enable row level security;
alter table ai_agents enable row level security;
alter table admin_notifications enable row level security;
alter table admin_profiles enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid()
  );
$$ language sql security definer stable;

do $$
declare
  t text;
begin
  foreach t in array array[
    'studios','channels','contacts','contact_identities','conversations',
    'messages','availability_rules','availability_blocks','appointments',
    'campaigns','campaign_contacts','ai_agents','admin_notifications'
  ]
  loop
    execute format(
      'create policy "admins_full_access" on %I for all using (is_admin()) with check (is_admin());',
      t
    );
  end loop;
end $$;

create policy "self_profile" on admin_profiles
  for select using (id = auth.uid());
create policy "self_profile_update" on admin_profiles
  for update using (id = auth.uid());
