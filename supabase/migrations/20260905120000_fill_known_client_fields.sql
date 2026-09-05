-- Business Ops App: fill known-empty fields with real context from Ben's other
-- working memory (client project notes, Sam Carson portfolio financials, the
-- 3TR CRM sync, payment_schedules already live in this app). Every write below
-- is guarded to touch ONLY empty/blank fields — nothing that already has a
-- value gets overwritten. Safe to run more than once (idempotent).
--
-- Confidence varies by client — see the accompanying chat message for which
-- names/fields are solid vs. best-guess. Client names use ILIKE so small
-- formatting differences in the live table still match; a name that doesn't
-- exist in `clients` simply updates 0 rows here, no harm done.

-- ============================================================
-- 1. quarterly_goal (only where currently null/blank)
-- ============================================================

update clients set quarterly_goal =
  'Re-run the SEO cycle (~9/22 target), confirm the mobile PageSpeed fixes held, and build spring launch assets (trifolds, door hangers, A-frame props, ad stockpile) during the winter Meta-ad pause.'
where name ilike '%j&c asphalt%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Support the portfolio-wide comp restructure (revenue-share model + pooled bonus pool) and resolve how the $5,000/mo Sam Carson portfolio deal splits across companies.'
where name ilike '%swingin dance%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Confirm GA4 generate_lead conversions are actually firing end-to-end (n8n webhook currently gates the event) so Google Ads spend has real conversion data.'
where name ilike '%swingin mechanical bulls%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Address the Taft equity-vs-contribution question as part of the portfolio comp restructure; track whether the Tipping Point acquisition affects WEC.'
where name ilike '%western events center%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Wind the relationship down cleanly — finish committed site work only, no new scope, agree a close-out timeline with Sam Carson.'
where name ilike '%iron rescue%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Confirm final deliverables and close out billing cleanly.'
where name ilike '%art room%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Get the relationship off the ground — lock initial scope, first deliverables, and analytics/tracking foundation.'
where (name ilike '%uinta tactical%' or name ilike '%utp%') and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Keep the n8n lead-routing webhook reliable — SMB, WEC, and SDC form submissions all depend on it.'
where (name ilike '%auto-mate%' or name ilike '%auto mate%') and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Explore the firearms-friendly payment processor swap (or custom Medusa.js storefront) so checkout can go live; keep the licensing-style deal with Sam moving.'
where name ilike '%peak defense%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Nail down a defensible revenue number before citing results anywhere again (the $500K figure was pulled from the case study over measurement concerns).'
where name ilike '%uptown drapes%' and (quarterly_goal is null or quarterly_goal = '');

update clients set quarterly_goal =
  'Keep the case study and site content in sync with real completed jobs (confirmed brand spelling is "RNR", not "R&R" — rnrcrew.com).'
where name ilike '%rnr%' and (quarterly_goal is null or quarterly_goal = '');

-- ============================================================
-- 2. pay_date / payment_method (only where currently null) —
-- limited to the 3 clients whose real billing day is already
-- known from this app's own payment_schedules table.
-- ============================================================

update clients set pay_date = date_trunc('month', now())::date + interval '12 days'
where name ilike '%swingin dance%' and pay_date is null; -- 13th, matches payment_schedules

update clients set pay_date = date_trunc('month', now())::date + interval '21 days'
where name ilike '%western events center%' and pay_date is null; -- 22nd, matches payment_schedules

update clients set pay_date = date_trunc('month', now())::date + interval '27 days'
where name ilike '%swingin mechanical bulls%' and pay_date is null; -- 28th, matches payment_schedules

-- payment_method intentionally left alone everywhere — not known for any
-- client from any source, not guessing it.

-- ============================================================
-- 3. notes — append only, guarded against duplicate re-runs
-- ============================================================

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Winter pivot: paused Meta ad spend (Google Ads still running), building spring launch assets. Jeffrey funds closer Aranza but leads route to Edward''s crew for fulfillment — worth revisiting comp math. Avg job size ~$8,500 for revenue-claim purposes.'
where name ilike '%j&c asphalt%' and notes not ilike '%winter pivot%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Part of Sam Carson''s portfolio (with WEC, SMB, Iron Rescue, Auto-Mate). Real financials: ~$30k gross/mo, modest margin — invalidated earlier % comp modeling.'
where name ilike '%swingin dance%' and notes not ilike '%sam carson%portfolio%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'GA4 tag G-YPR6R81CDV confirmed correct. Zero-conversion appearance traced to the form success handler only firing generate_lead after an n8n webhook succeeds — check webhook latency/failures if conversions look wrong again. Privacy/Terms pages live but cancellation window, ceiling height, etc. are unconfirmed placeholder numbers — revisit with Sam.'
where name ilike '%swingin mechanical bulls%' and notes not ilike '%g-ypr6r81cdv%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Part of Sam Carson''s portfolio. Taft holds ~20% equity without proportional returns — ongoing tension, tied into the comp restructure.'
where name ilike '%western events center%' and notes not ilike '%taft%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Relationship winding down per Sam Carson, but real site work continues — status kept at closing rather than fully offboarded.'
where name ilike '%iron rescue%' and notes not ilike '%winding down%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Provides the n8n webhook that SMB, WEC, and SDC lead forms depend on for processing. Kaden''s lead-response playbook is stored here as a stopgap (no dedicated playbooks table exists yet).'
where (name ilike '%auto-mate%' or name ilike '%auto mate%') and notes not ilike '%n8n webhook%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Demo storefront — no live checkout yet. Shopify Payments froze funds over firearms-parts sales; considering a firearms-friendly processor swap or a custom Medusa.js + NMI storefront. Deal with Sam being reworked as a licensing-style royalty arrangement via Kaden.'
where name ilike '%peak defense%' and notes not ilike '%shopify payments%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Case study live on 3trmedia.com. The $500K revenue figure was deliberately left out of the case study — couldn''t defend how it was measured.'
where name ilike '%uptown drapes%' and notes not ilike '%500k%';

update clients set notes = coalesce(notes || E'\n\n', '') ||
  'Case study live on 3trmedia.com. Real domain is rnrcrew.com — brand name is "RNR Construction", not "R&R" (the logo glyph is ambiguous).'
where name ilike '%rnr%' and notes not ilike '%rnrcrew%';

-- ============================================================
-- 4. client_focuses — insert 3 blank-labeled rows if none exist
-- yet for a client, then fill any still-blank rows in position
-- order. Never touches a row that already has real text.
-- ============================================================

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Re-run SEO cycle, verify mobile perf gains held'),
  (1, 'Build spring launch assets during Meta ad pause'),
  (2, 'Track Jeffrey/Aranza lead-routing math with Sam Carson')
) as v(position, text)
where c.name ilike '%j&c asphalt%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Resolve per-company split of the $5,000/mo portfolio deal'),
  (1, 'Support pooled department budget model across portfolio'),
  (2, 'Keep sister-site footer links (WEC, SMB) current')
) as v(position, text)
where c.name ilike '%swingin dance%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Confirm n8n webhook is not silently killing GA4 conversion events'),
  (1, 'Confirm placeholder legal-page numbers with Sam'),
  (2, 'Monitor /contact page Ads conversion tracking')
) as v(position, text)
where c.name ilike '%swingin mechanical bulls%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Support portfolio bonus-pool rollout (30/23/23/23 split)'),
  (1, 'Keep sister-site footer links (SDC, SMB) current'),
  (2, 'Track Tipping Point acquisition progress')
) as v(position, text)
where c.name ilike '%western events center%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Finish committed work only, no new scope'),
  (1, 'Agree a close-out timeline with Sam Carson'),
  (2, '')
) as v(position, text)
where c.name ilike '%iron rescue%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Confirm final deliverables'),
  (1, 'Close out last invoice'),
  (2, '')
) as v(position, text)
where c.name ilike '%art room%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Lock initial scope and first deliverables'),
  (1, 'Set up analytics/tracking foundation'),
  (2, '')
) as v(position, text)
where (c.name ilike '%uinta tactical%' or c.name ilike '%utp%')
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Keep the shared n8n webhook reliable for SMB/WEC/SDC forms'),
  (1, 'Migrate Kaden''s lead-response notes out of ad-hoc storage'),
  (2, '')
) as v(position, text)
where (c.name ilike '%auto-mate%' or c.name ilike '%auto mate%')
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Decide: firearms-friendly processor vs. custom Medusa.js storefront'),
  (1, 'Finalize licensing-style deal terms with Sam via Kaden'),
  (2, '')
) as v(position, text)
where c.name ilike '%peak defense%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Nail down a defensible revenue number'),
  (1, 'Keep case study content in sync with real results'),
  (2, '')
) as v(position, text)
where c.name ilike '%uptown drapes%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

insert into client_focuses (client_id, text, done, position)
select c.id, v.text, false, v.position
from clients c
cross join (values
  (0, 'Verify real job photos/results are current'),
  (1, 'Confirm case study numbers still accurate'),
  (2, '')
) as v(position, text)
where c.name ilike '%rnr%'
  and not exists (select 1 from client_focuses cf where cf.client_id = c.id);

-- fill any already-existing-but-blank focus rows for the same clients,
-- in position order, without touching rows that already have text
with wanted (name_pattern, position, text) as (
  values
    ('%j&c asphalt%', 0, 'Re-run SEO cycle, verify mobile perf gains held'),
    ('%j&c asphalt%', 1, 'Build spring launch assets during Meta ad pause'),
    ('%j&c asphalt%', 2, 'Track Jeffrey/Aranza lead-routing math with Sam Carson'),
    ('%swingin dance%', 0, 'Resolve per-company split of the $5,000/mo portfolio deal'),
    ('%swingin dance%', 1, 'Support pooled department budget model across portfolio'),
    ('%swingin dance%', 2, 'Keep sister-site footer links (WEC, SMB) current'),
    ('%swingin mechanical bulls%', 0, 'Confirm n8n webhook is not silently killing GA4 conversion events'),
    ('%swingin mechanical bulls%', 1, 'Confirm placeholder legal-page numbers with Sam'),
    ('%swingin mechanical bulls%', 2, 'Monitor /contact page Ads conversion tracking'),
    ('%western events center%', 0, 'Support portfolio bonus-pool rollout (30/23/23/23 split)'),
    ('%western events center%', 1, 'Keep sister-site footer links (SDC, SMB) current'),
    ('%western events center%', 2, 'Track Tipping Point acquisition progress'),
    ('%iron rescue%', 0, 'Finish committed work only, no new scope'),
    ('%iron rescue%', 1, 'Agree a close-out timeline with Sam Carson'),
    ('%art room%', 0, 'Confirm final deliverables'),
    ('%art room%', 1, 'Close out last invoice'),
    ('%uinta tactical%', 0, 'Lock initial scope and first deliverables'),
    ('%uinta tactical%', 1, 'Set up analytics/tracking foundation'),
    ('%peak defense%', 0, 'Decide: firearms-friendly processor vs. custom Medusa.js storefront'),
    ('%peak defense%', 1, 'Finalize licensing-style deal terms with Sam via Kaden'),
    ('%uptown drapes%', 0, 'Nail down a defensible revenue number'),
    ('%uptown drapes%', 1, 'Keep case study content in sync with real results'),
    ('%rnr%', 0, 'Verify real job photos/results are current'),
    ('%rnr%', 1, 'Confirm case study numbers still accurate')
)
update client_focuses cf
set text = w.text
from clients c, wanted w
where cf.client_id = c.id
  and c.name ilike w.name_pattern
  and cf.position = w.position
  and (cf.text is null or cf.text = '');

-- ============================================================
-- 5. past_clients — NTAC (churned per CRM)
-- ============================================================

update past_clients set industry =
  'Tactical / night-vision gear'
where name ilike '%ntac%' and (industry is null or industry = '');

update past_clients set notes = coalesce(notes || E'\n\n', '') ||
  'A NTAC/Darren night-vision video concept was drafted for the DP Ben B channel but never produced/inserted into the content pipeline.'
where name ilike '%ntac%' and notes not ilike '%night-vision video concept%';

-- ============================================================
-- 6. leads — fill industry/notes for the ones with real context
-- ============================================================

update leads set notes = coalesce(notes || E'\n\n', '') ||
  '5th company in Sam Carson''s rotation (with SDC/WEC/SMB/Iron Rescue/Auto-Mate). Pre-launch. Formerly named Iron Rentals / West Ridge Rentals.'
where name ilike '%westridge%' and notes not ilike '%sam carson%rotation%';

update leads set notes = coalesce(notes || E'\n\n', '') ||
  'Sam Carson''s brother, referred by Jeffrey.'
where name ilike '%ben carson%' and notes not ilike '%sam carson%brother%';

update leads set notes = coalesce(notes || E'\n\n', '') ||
  'Blackout brand lead, referred via Easton.'
where name ilike '%tier1%' and notes not ilike '%easton%';

update leads set notes = coalesce(notes || E'\n\n', '') ||
  'Prospect site work not yet started as of last check.'
where name ilike '%hoffman tactical%' and notes not ilike '%not yet started%';
