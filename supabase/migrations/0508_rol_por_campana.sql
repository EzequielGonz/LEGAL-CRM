-- ---------------------------------------------------------------------
-- 24/10 · Rol del agente por campaña.
--
-- campaigns.agent_role_id: el rol con el que el agente aborda a los
-- contactos de esa campaña. Vale solo para esa campaña y manda sobre el
-- rol de la base. Sin rol, responde con el agente del perfil (y el rol de
-- la base, si tiene). Se elige y edita desde el detalle de la campaña.
--
-- Repetible, con RLS ya vigente en campaigns y agent_roles. Sin borrados.
-- ---------------------------------------------------------------------
alter table public.campaigns add column if not exists agent_role_id uuid references public.agent_roles(id) on delete set null;
create index if not exists campaigns_agent_role_idx on public.campaigns (agent_role_id) where agent_role_id is not null;
