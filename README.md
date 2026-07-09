# sunday signal

sunday signal is an internal tool for sunday's sales team. It gives each
rep one place to see everything that matters on their top accounts — deal
health, contacts, and the buying signals that show a prospect is worth
reaching out to now — and to act on it immediately instead of digging
through Salesforce.

## What it does

- **Feed** — a live stream of signals across a rep's accounts (a job
  change, competitor activity, funding, expansion, a new hire...), each
  with a one-click action.
- **My accounts** — the rep's book, ranked by priority so it's obvious
  which accounts need attention now versus this week or this month.
- **Account view** — everything about one account in one screen: deal
  health, deal stage, the buying committee and their contact details,
  recommended next actions, and the signal history.
- **Market · TAM** — accounts the rep doesn't own yet, for prospecting.
- **Tasks** — a simple to-do list and activity log.

Behind the scenes, the account and signal data comes from Salesforce and
Qobra (commissions), and fresh buying signals are detected automatically
every day and pushed onto the platform, so a rep's feed is always
up to date without anyone having to go looking for news themselves.

## The agents behind the actions

A few buttons on the platform hand off to a dedicated agent to do the
actual work:

1. **Prioritization** — every time new signals come in, an agent scores
   and tiers each account (act now / this week / this month), which is
   what powers the ranking on the Feed and "My accounts".
2. **Email generation** ([`email-generation-agent-simplified.md`](./email-generation-agent-simplified.md))
   — triggered from "Send email" on an account or a signal. It reads the
   signal and the decision-maker's details and writes a personalized
   outreach email in sunday's voice, ready to send.
3. **Decision-maker & contact enrichment** ([`decisionmakeragentuk-fullenrich.md`](./decisionmakeragentuk-fullenrich.md))
   — used in two places: on an account's contact list, to fill in a
   missing email or phone number for a known contact; and on Market/TAM
   accounts with no contacts at all, to find the right decision-maker
   (the right person at the venue or at group level) and enrich them
   with verified contact details.
4. **Deck generation** — the "Generate deck" action, which produces a
   ready-to-share deck (for example a group-expansion deck) straight
   from an account's signals.

## Repo layout

- `app/` — the frontend reps use every day.
- `SCHEMA.md` — what the underlying data looks like.
- `email-generation-agent-simplified.md`, `decisionmakeragentuk-fullenrich.md`
  — the agent prompts described above.
- `scripts/` — the jobs that load Salesforce, Qobra, and signal data.
