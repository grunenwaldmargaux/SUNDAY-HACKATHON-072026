# Supabase schema — sunday Sales ABM tool

Data warehouse for a sales/ABM tool covering 4 UK reps (Macarena Cibran Rosado,
Natalia Sanz Dawson, Virginia Guglielmi, Kim Machipisa). Loaded **one-shot**
(no recurring sync) from Salesforce (via `sf` CLI / SOQL) and Qobra (manual
monthly statement exports, Qobra's reporting API wasn't accessible with the
available key). Reload with `scripts/load_salesforce_data.py` and
`scripts/load_qobra_statements.py` if the data needs refreshing.

Supabase project ref: `jvmebywlusemucgbomgl` (region `eu-west-2`).

No foreign keys are enforced (kept simple for a one-shot load) — joins are by
convention on the id/email columns described below. RLS is currently
**disabled** on all tables — enable it before exposing the anon key to any
public-facing client.

## Salesforce tables

### `sf_accounts`
UK accounts. `account_role` distinguishes three populations loaded together
in the same table:
- `customer` — UK accounts company-wide with `stage` in Active/Partially
  Active/Onboarding (609 rows) — used for the "similar accounts" comparison
  pool, not limited to the 4 reps.
- `prospect` — accounts tied to the 4 reps' open opportunities (61 rows).
- `parent` — ancestor/holding accounts pulled in for hierarchy context only,
  not otherwise owned by the 4 reps (14 rows).

Columns: `id`, `name`, `owner_id`, `owner_email`, `parent_id` (immediate
Salesforce parent), `highest_parent_id` (root of the hierarchy),
`billing_country/city/postal_code`, `industry`, `number_of_employees`,
`range_of_employees`, `annual_turnover`, `average_yearly_turnover`,
`venue_type`, `ai_restaurant_type`, `number_of_locations`, `stage`
(Salesforce `Stage__c`), `pos` (POS system in use), `is_holding` (true if
this account is itself a holding — 1,439 exist UK-wide, 153 are in this
table), `ai_research`, `ai_sunday_fit`, `ai_signals`, `ai_summary`,
`ai_agent_score`, `ai_agent_reasoning`, `ai_agent_timestamp`,
`ai_group_identification` (free-text group/segment tag, e.g. "Enterprise
(15+ locations) - Pizza Pilgrims" — **populated on child/venue accounts**,
not on the holding account itself; the 153 holdings in this table are mostly
null here), `account_role`.

Note: the ~1,564 *child* accounts of these 153 holdings (where
`ai_group_identification` actually lives) are not yet loaded — only counted
live via SOQL so far. Load them the same way if the tool needs to browse a
holding's full venue list.

### `sf_opportunities`
Open opportunities (`IsClosed = false`) owned by the 4 reps, UK accounts only
(110 rows). `record_type` is `Business Opportunity` or `Holding Opportunity`
(Salesforce RecordType, not a `Type` field). `related_holding_opp_id` links a
Business opp to its parent Holding opp. `parent_account_field_id` is the
`Parent_Account__c` lookup (distinct from the Account hierarchy).

### `sf_opportunity_products`
Line items (`OpportunityLineItem`) for the open opportunities above (251
rows) — which products are in each open deal, with pricing
(`unit_price`/`list_price`/`total_price`) and `estimated_monthly_net_revenue`.

### `sf_assets`
Active products for customer accounts (1,329 rows), each linked back to the
opportunity product it originated from via `opportunity_product_id`
(Salesforce `Opportunity_Product__c`) — this is how to get a customer's
active products with their original deal pricing. Also has `status`,
`install_date`, `onboarding_date`, `price`, `account_tier`, `account_status`.

### `sf_account_adoption_metrics`
One row per account (684 rows, same set as `sf_accounts`), the 37 fields on
the Salesforce Account object whose inline help text says "Updated by
Hightouch once a day" — adoption %, GTV, net revenue, best week/month ever,
current week/month cumulative, connected/not-connected activity counts. Key
for the "product adoption" part of the account view. `account_id` is the
join key back to `sf_accounts.id`.

### `sf_tasks`
Sales activity for the 4 reps, last 90 days (4,702 rows) — used to measure
contact touchpoints. `who_id`/`what_id` are the Salesforce polymorphic
lookups (Contact/Lead, Account/Opportunity), `task_subtype` (Call, Email,
LinkedIn...), `type` (Cold call, Discovery, Demo, Follow-up...).

## Qobra tables

Loaded from manual `.xlsx` statement exports (Qobra's `/v1/users` API works
but has no plan/quota data; the v2 reporting endpoints returned
403/404/401 regardless of auth scheme tried — exports were the fallback).

### `qobra_rep_performance` / `qobra_rep_attainment` (view)
One row per rep per month: `monthly_quota`, `onboarded_amnr` (amount
achieved), `signed_emnr`. The view adds `attainment_pct` = onboarded_amnr /
monthly_quota * 100. `owner_email` joins to `sf_accounts.owner_email` /
`sf_opportunities.owner_email`.

### `qobra_bonus_line_items`
Per-account bonus detail feeding each rep's commission (22 rows) —
`unique_key` embeds a Salesforce object id as a prefix, usable as a loose
join hint back to Salesforce.

### `qobra_opportunities`
Per-opportunity detail behind the bonus (37 rows), matched to Salesforce
opportunities by name pattern, not id.

## Reloading

```
python3 scripts/load_salesforce_data.py   # requires `sf` CLI logged into SF-PROD
python3 scripts/load_qobra_statements.py  # requires qobra/*.xlsx exports present
```

Both read `SUPABASE_ACCESS_TOKEN` from `.env` (see `.env.example`) and use
the Supabase Management API to run SQL directly — no DB password needed.
