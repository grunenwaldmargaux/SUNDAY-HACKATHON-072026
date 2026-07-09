# SUNDAY-HACKATHON-072026

Data layer for a sales/ABM tool: Salesforce + Qobra data loaded one-shot into
Supabase for the 4 UK reps (Macarena, Natalia, Virginia, Kim).

- [`SCHEMA.md`](./SCHEMA.md) — full table-by-table description of what's in Supabase.
- `scripts/load_salesforce_data.py` — pulls accounts/opportunities/tasks/assets/adoption metrics via `sf` CLI.
- `scripts/load_qobra_statements.py` — parses `qobra/*.xlsx` monthly statement exports.
- `.env.example` — required env vars (`QOBRA_API_KEY`, `SUPABASE_ACCESS_TOKEN`); copy to `.env` and fill in, never commit `.env`.

Supabase project ref: `jvmebywlusemucgbomgl` (region `eu-west-2`). Connection
keys (anon/service_role) are shared out of band, not in this repo.
