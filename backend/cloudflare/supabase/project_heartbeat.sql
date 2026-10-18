-- codeguard:components:start
-- Source: backend/cloudflare/supabase/project_heartbeat.sql
-- Declarations and references retain their native language names and order.
-- codeguard:components:end
-- Run once in the Supabase SQL Editor for the project's keep-alive RPC.
-- Only the server-side service_role can call this function; it reads or changes no data.
create or replace function public.project_heartbeat()
returns boolean
language sql
volatile
as $$
  select true;
$$;

revoke all on function public.project_heartbeat() from public, anon, authenticated;
grant execute on function public.project_heartbeat() to service_role;
notify pgrst, 'reload schema';
