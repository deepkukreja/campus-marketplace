-- OPTIONAL: reviewed Supabase Database Advisor suggestions for after testing.
-- Review in the SQL editor; NOT auto-applied to the live project.
-- Requires SQL privileges appropriate to the Supabase project.

-- An RLS event-trigger helper should not be exposed as a public RPC.
-- Confirm this function has no intentional app caller before running.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Performance indexes requested by the database advisor.
create index if not exists conversations_interested_user_id_idx
    on public.conversations (interested_user_id);
create index if not exists conversations_requester_id_idx
    on public.conversations (requester_id);
create index if not exists messages_sender_id_idx
    on public.messages (sender_id);

-- Separate manual Supabase Dashboard step:
-- Authentication > Providers / Security: turn on leaked-password protection
-- if available for your plan; review user-facing login behavior afterwards.
