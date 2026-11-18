-- ClouDonna Platform — Revenue Operations funnel events (brief §51)
--
-- Additive-only extension of the existing business_event_name enum
-- (20260809130000) — reuses the same first-party, staff-read-only
-- business_events table rather than creating a second events table.
-- These eight are server-side, staff-action events (an opportunity
-- actually created, a sprint actually started) written by the
-- Commercial/Revenue Operations repositories after a mutation
-- succeeds — never a client-side ad-tracking call.

alter type business_event_name add value 'inquiry_qualified';
alter type business_event_name add value 'opportunity_created';
alter type business_event_name add value 'proposal_sent';
alter type business_event_name add value 'opportunity_won';
alter type business_event_name add value 'decision_sprint_started';
alter type business_event_name add value 'decision_sprint_completed';
alter type business_event_name add value 'team_conversion';
alter type business_event_name add value 'enterprise_expansion';
