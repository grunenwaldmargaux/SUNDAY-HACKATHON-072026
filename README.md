# sunday signal

An internal sales/ABM platform for sunday's UK sales team. It gives each rep
a single, fast surface to see what's happening on their top accounts —
buying signals, deal health, contacts, pipeline — and to act on it
immediately (send an email, enrich a contact, generate a deck) instead of
digging through Salesforce.

This repo has two halves:
- **`app/`** — the React/Vite/TypeScript frontend reps use day to day.
- **Everything else** — the data layer and agent prompts that feed it:
  Salesforce + Qobra data loaded into Supabase, a daily signal-detection
  cron via Sillage, and the standalone agent prompts triggered from the UI.

## How data flows

```
Salesforce (sf CLI)  ─┐
Qobra (.xlsx exports) ─┼─► Supabase (jvmebywlusemucgbomgl, eu-west-2) ─► app/ (reps' UI)
Sillage (cron, daily) ─┘
```

- **Salesforce & Qobra**: loaded **one-shot** (no recurring sync) — accounts,
  opportunities, assets, adoption metrics, tasks, and rep commission data
  for the 4 UK reps (Macarena Cibran Rosado, Natalia Sanz Dawson, Virginia
  Guglielmi, Kim Machipisa). Reload with `scripts/load_salesforce_data.py`
  and `scripts/load_qobra_statements.py` if the data goes stale. Full
  table-by-table description: [`SCHEMA.md`](./SCHEMA.md).
- **Sillage signals**: runs **daily on a cron**, detecting new buying
  signals per account (job changes, competitor activity, funding, hiring,
  expansion, customer/champion moves, keyword mentions...) and writing them
  into `sillage_signals` (joined to `sf_accounts` via `sillage_companies`).
  These are what show up as new signal cards on a rep's feed and account
  pages. Loaded via `scripts/load_sillage_signals.py`
  (`scripts/load_sillage_data.py` handles company/contact mapping).

No foreign keys are enforced and RLS is currently disabled — see
[`SCHEMA.md`](./SCHEMA.md) before exposing this beyond the demo.

## Agents

Several points in the product hand off to an agent to prioritize, generate
content, or enrich data. In this repo, the standalone prompts live at the
root as `*.md` files; the account-tiering/prioritization logic runs as a
Sillage skill (signal playbook) on the Sillage side and surfaces in the app
as the account score/tier.

1. **Signal prioritization** (Sillage skill/playbook, not a file in this
   repo) — as signals come in, this skill scores and tiers every account —
   which ones need action *now*, this week, or this month. In the app this
   is the account **score + tier** (`Hot` / `Warm` / `Watch`, see
   `app/src/lib/format.ts:tierFor`) shown on the Feed and account pages, and
   is what drives which accounts get "next best action" cards.
2. **Email generation** — [`email-generation-agent-simplified.md`](./email-generation-agent-simplified.md).
   Triggered from the "Send email" action on an account or a signal card.
   Takes the detected signal + decision-maker details and writes a
   personalized outreach email (signal hook → bridge to sunday → proof →
   CTA) in sunday's brand voice.
3. **Decision-maker discovery & contact enrichment** — [`decisionmakeragentuk-fullenrich.md`](./decisionmakeragentuk-fullenrich.md).
   Two-phase FullEnrich-only agent (find → enrich). Two entry points in the
   UI:
   - On an account's contact list, when a known contact is missing an
     email/phone, "Enrich contact" enriches that specific person.
   - On a Market/TAM account (no contacts yet), "Assign to agent · enrich"
     uses the account's domain/LinkedIn to find the right decision-maker
     (venue-level GM vs. group-level CEO/COO, see the agent's VENUE/GROUP
     logic) and then enriches them with a verified email + phone.
4. **Deck generation** — the "Generate deck" next-best-action (Gamma-backed,
   e.g. a group-expansion deck) surfaced on Feed/account signal cards.

## The app (`app/`)

React 19 + TypeScript + Vite. Pages (see `app/src/state/nav.ts`):
- **Feed** — chronological signal feed across all of a rep's accounts, with
  one-click actions per signal.
- **My accounts** (pipeline) — the rep's book, sorted by tier/score.
- **Account detail** — full account view: score/tier, deal-health, deal
  cycle stage, buying committee/contacts, next-best-actions, signal
  timeline.
- **Market · TAM** — accounts not yet in the rep's book; where the
  decision-maker discovery agent gets triggered.
- **Tasks** — to-do list + activity log.

Data source is swappable via `VITE_DATA_SOURCE` (`mock` or `supabase`, see
`app/src/data/source/`). Run it:

```
cd app
npm install
npm run dev
```

Copy `app/.env.example` to `app/.env.local` and fill in
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to point at real data instead
of mock data.

## Reloading the data layer

```
python3 scripts/load_salesforce_data.py   # requires `sf` CLI logged into SF-PROD
python3 scripts/load_qobra_statements.py  # requires qobra/*.xlsx exports present
python3 scripts/load_sillage_data.py      # Sillage company/contact mapping
python3 scripts/load_sillage_signals.py   # Sillage signals (run on a daily cron)
```

All read secrets from `.env` at the repo root (see `.env.example`:
`QOBRA_API_KEY`, `SUPABASE_ACCESS_TOKEN`, `SILLAGE_API_KEY`) and use the
Supabase Management API to run SQL directly — no DB password needed. Never
commit `.env`.
