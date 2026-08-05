-- Record the host a lead was submitted on, alongside landing_page_id.
--
-- The founder reads leads in Supabase Studio (no admin UI — ADR-0007) and
-- `landing_page_id` is a uuid: telling two tenants apart means keeping a
-- uuid → domain mapping in your head, or a manual join, on every glance at the
-- table. `domain` makes the provenance readable in the default grid view.
--
-- This is not a cached join. It is a snapshot of the host at submission time:
-- if a tenant later migrates domain, historical leads keep the domain they
-- actually arrived on, which is what "where did this lead come from" means.
-- `landing_page_id` remains the foreign key and the source of truth for
-- ownership — nothing reads `domain` to decide anything.
--
-- No index: filtering by domain is the read pattern, but the cardinality is one
-- row per client and the table is small. Add one when volume justifies it.

alter table public.leads add column domain text;

update public.leads as l
   set domain = p.domain
  from public.landing_pages as p
 where p.id = l.landing_page_id;

-- Safe: landing_page_id is `not null` with an FK, so every row above matched.
alter table public.leads alter column domain set not null;

comment on column public.leads.domain is
  'Host the lead was submitted on, captured at insert time from the Host header. Provenance snapshot: deliberately does not follow a later domain change on landing_pages.';
