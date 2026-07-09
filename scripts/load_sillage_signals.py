#!/usr/bin/env python3
"""Load Sillage's real signals (list_signals) into Supabase, replacing the
app's crude keyword-guessed feed items with sourced, dated, attributed ones.

One-shot: paginates sillage_v2_list_signals (cursor-based) for the whole
workspace, resolves the contact name via sillage_v2_get_lead for signal
types that don't embed an author (job_update: recentlyPromoted/newJob), and
upserts into sillage_signals — joined to sf_accounts via
sillage_companies.account_id.
"""
import json
import os
import urllib.request

SILLAGE_URL = "https://api.getsillage.com/api/mcp/v2"
SUPABASE_REF = "jvmebywlusemucgbomgl"
ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")


def load_env():
    env = {}
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v
    return env


def sillage_call(method, params, token):
    req = urllib.request.Request(
        SILLAGE_URL,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def sillage_tool(name, arguments, token):
    res = sillage_call("tools/call", {"name": name, "arguments": arguments}, token)
    if "error" in res:
        raise RuntimeError(res["error"])
    return json.loads(res["result"]["content"][0]["text"])


def run_sql(query, token, ref):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{ref}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def sql_str(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


SCHEMA_SQL = """
create table if not exists sillage_signals (
    id int primary key,
    signal_type text,
    company_id int,
    account_id text,
    domain text,
    lead_id int,
    agent_id int,
    detected_at timestamptz,
    signal_date timestamptz,
    source_url text,
    author_name text,
    author_headline text,
    author_linkedin_url text,
    excerpt text,
    data jsonb,
    action_name text,
    loaded_at timestamptz default now()
);
"""

# Button label shown on the signal card, per Sillage signal_type — mirrors
# the playbook's suggested_action, condensed to a short CTA.
ACTION_NAME_BY_SIGNAL_TYPE = {
    "keywordDetection": "Reference their post",
    "jobPostingKeywordDetection": "Flag open role",
    "recentlyPromoted": "Send congrats",
    "newJob": "Send congrats",
    "competitorInboundComment": "Reach out now",
    "competitorOutboundComment": "Reach out now",
    "customerInboundComment": "Ask for intro",
    "customerOutboundComment": "Ask for intro",
    "partnerInboundComment": "Ask for intro",
    "partnerOutboundComment": "Ask for intro",
    "influencerInboundComment": "Join conversation",
    "influencerOutboundComment": "Join conversation",
    "championInboundComment": "Ask champion to intro",
    "championOutboundComment": "Ask champion to intro",
}


def build_upsert(table, rows, conflict_cols):
    if not rows:
        return ""
    cols = list(rows[0].keys())
    values_sql = ",\n".join(
        "(" + ", ".join(sql_str(row[col]) for col in cols) + ")" for row in rows
    )
    update_sql = ", ".join(f"{col} = excluded.{col}" for col in cols if col not in conflict_cols)
    conflict_sql = ", ".join(conflict_cols)
    return (
        f"insert into {table} ({', '.join(cols)}) values\n{values_sql}\n"
        f"on conflict ({conflict_sql}) do update set {update_sql};"
    )


def main():
    env = load_env()
    sillage_token = env["SILLAGE_API_KEY"]
    supabase_token = env["SUPABASE_ACCESS_TOKEN"]

    print("Creating sillage_signals schema...")
    run_sql(SCHEMA_SQL, supabase_token, SUPABASE_REF)

    # sillage_signals.company_id is a *different* id space than
    # sillage_companies.sillage_company_id (company_mapping's nested company.id) —
    # it matches read_top_account_list's top-level `id`. Rebuild the map from
    # that endpoint instead of trusting the two id spaces to line up.
    print("Loading company_id -> domain map from read_top_account_list...")
    top_list = sillage_tool("sillage_v2_read_top_account_list", {"view": "accounts", "page": 1, "page_size": 100}, sillage_token)
    domain_by_company_id = {a["id"]: a["company"]["domain"] for a in top_list["data"]}

    print("Loading domain -> account_id map from sf_accounts...")
    accts = run_sql("select id, domain from sf_accounts where domain is not null;", supabase_token, SUPABASE_REF)
    account_id_by_domain = {a["domain"]: a["id"] for a in accts}

    company_map = {}
    for company_id, domain in domain_by_company_id.items():
        company_map[company_id] = {"domain": domain, "account_id": account_id_by_domain.get(domain)}

    print("Paginating sillage_v2_list_signals...")
    signals = []
    cursor = None
    while True:
        args = {"page_size": 100}
        if cursor:
            args["cursor"] = cursor
        res = sillage_tool("sillage_v2_list_signals", args, sillage_token)
        signals.extend(res["data"])
        if not res["meta"].get("has_more"):
            break
        cursor = res["meta"]["next_cursor"]
    print(f"  {len(signals)} signals found")

    lead_cache = {}

    def resolve_lead(lead_id):
        if lead_id in lead_cache:
            return lead_cache[lead_id]
        try:
            lead = sillage_tool("sillage_v2_get_lead", {"lead_id": lead_id}, sillage_token)["data"]
        except Exception as e:
            print(f"  warning: could not resolve lead {lead_id}: {e}")
            lead = None
        lead_cache[lead_id] = lead
        return lead

    rows = []
    for s in signals:
        author = s.get("author")
        author_name = author.get("full_name") if author else None
        author_headline = author.get("headline") if author else None
        author_linkedin = author.get("linkedin_url") if author else None

        # job_update signals (recentlyPromoted/newJob) don't embed an author —
        # resolve the contact who moved via their lead_id.
        if not author_name and s.get("lead_id"):
            lead = resolve_lead(s["lead_id"])
            if lead:
                author_name = f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip()
                author_headline = lead.get("linkedin_headline")
                author_linkedin = lead.get("linkedin_url")

        company = company_map.get(s.get("company_id"), {})
        rows.append({
            "id": s["id"],
            "signal_type": s["signal_type"],
            "company_id": s.get("company_id"),
            "account_id": company.get("account_id"),
            "domain": company.get("domain"),
            "lead_id": s.get("lead_id"),
            "agent_id": s.get("agent_id"),
            "detected_at": s.get("detected_at"),
            "signal_date": s.get("signal_date"),
            "source_url": s.get("source_url"),
            "author_name": author_name,
            "author_headline": author_headline,
            "author_linkedin_url": author_linkedin,
            "excerpt": s.get("excerpt"),
            "data": s.get("data"),
            "action_name": ACTION_NAME_BY_SIGNAL_TYPE.get(s["signal_type"], "Assign to agent"),
        })

    print("Loading into Supabase...")
    for i in range(0, len(rows), 200):
        run_sql(build_upsert("sillage_signals", rows[i:i + 200], ["id"]), supabase_token, SUPABASE_REF)

    print(f"Done. {len(rows)} signals loaded.")


if __name__ == "__main__":
    main()
