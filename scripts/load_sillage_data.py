#!/usr/bin/env python3
"""Load Sillage's enriched company + contact data into Supabase, matched to
sf_accounts by domain.

One-shot: pulls every company mapping already ingested in the Sillage
workspace (currently the same 18 "top accounts" curated earlier) via its MCP
server, and upserts company + contact-profile data keyed by domain. Also
backfills sf_accounts.domain (previously unset) so the join works and stays
usable for any account added later.
"""
import json
import os
import urllib.request

SILLAGE_URL = "https://api.getsillage.com/api/mcp/v2"
SUPABASE_REF = "jvmebywlusemucgbomgl"
ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")

# Known domain -> Salesforce Account Id for the 18 curated top accounts
# (resolved earlier by matching Account.Domain__c/Website in Salesforce).
TOP_ACCOUNT_DOMAINS = {
    "bigmammagroup.com": "0010900000Hmwn7AAB",
    "lane7.com": "001AZ000002U4ecYAC",
    "gordonramsayrestaurants.com": "00109000017BYuZAAW",
    "buzzworksholdings.com": "0010900000wKOBDAA4",
    "megans.co.uk": "0010900000sZsVQAA0",
    "sixbynico.co.uk": "001AZ0000037qVAYAY",
    "markethalls.co.uk": "001W5000006rMmzIAE",
    "upmarketleisure.com": "001W500000WeEgAIAV",
    "boparanrestaurantgroup.co.uk": "0010900000wHWoXAAW",
    "nellspizza.co.uk": "001AZ000002yJ59YAE",
    "ciborestaurants.co.uk": "001W500000vMLBRIA4",
    "thebreakfastclubcafes.com": "0010900000sZsVpAAK",
    "madrestaurants.com": "001AZ000002b3d1YAA",
    "vivaitalianrestaurant.co.uk": "001bE00000dmvDgQAI",
    "wahaca.co.uk": "0010900000sZsVnAAK",
    "orka-koncepts.com": "001W500000kXgcKIAS",
    "pizzapilgrims.co.uk": "0010900000sZsWGAA0",
    "theblacklock.com": "0010900000sZsVjAAK",
}


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
    return "'" + str(v).replace("'", "''") + "'"


SCHEMA_SQL = """
create table if not exists sillage_companies (
    mapping_id int primary key,
    sillage_company_id int,
    account_id text,
    domain text,
    name text,
    linkedin_url text,
    status text,
    request_date timestamptz,
    loaded_at timestamptz default now()
);

create table if not exists sillage_contacts (
    id int primary key,
    mapping_id int,
    domain text,
    first_name text,
    last_name text,
    position text,
    linkedin_url text,
    linkedin_handle text,
    email text,
    phone_number text,
    location text,
    loaded_at timestamptz default now()
);
"""


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

    print("Backfilling sf_accounts.domain for the 18 top accounts...")
    run_sql("alter table sf_accounts add column if not exists domain text;", supabase_token, SUPABASE_REF)
    domain_rows = [{"id": acct_id, "domain": domain} for domain, acct_id in TOP_ACCOUNT_DOMAINS.items()]
    run_sql(build_upsert("sf_accounts", domain_rows, ["id"]), supabase_token, SUPABASE_REF)

    print("Creating sillage_companies / sillage_contacts schema...")
    run_sql(SCHEMA_SQL, supabase_token, SUPABASE_REF)

    print("Listing Sillage company mappings...")
    mappings = []
    page = 1
    while True:
        res = sillage_tool("sillage_v2_list_company_mappings", {"page": page, "page_size": 50}, sillage_token)
        mappings.extend(res["data"])
        if page >= res["meta"]["pagination"]["page_count"]:
            break
        page += 1
    print(f"  {len(mappings)} mappings found")

    companies, contacts = [], []
    for m in mappings:
        detail = sillage_tool(
            "sillage_v2_get_company_mapping",
            {"mapping_id": m["id"], "response_format": "detailed"},
            sillage_token,
        )
        domain = detail["company"]["domain"]
        account_id = TOP_ACCOUNT_DOMAINS.get(domain)
        companies.append({
            "mapping_id": detail["id"],
            "sillage_company_id": detail["company"]["id"],
            "account_id": account_id,
            "domain": domain,
            "name": detail["company"]["name"],
            "linkedin_url": detail["company"].get("linkedin_url"),
            "status": detail["status"],
            "request_date": detail["request_date"],
        })
        for p in detail.get("profiles", []):
            contacts.append({
                "id": p["id"],
                "mapping_id": detail["id"],
                "domain": domain,
                "first_name": p.get("first_name"),
                "last_name": p.get("last_name"),
                "position": p.get("position"),
                "linkedin_url": p.get("linkedin_url"),
                "linkedin_handle": p.get("linkedin_handle"),
                "email": p.get("email"),
                "phone_number": p.get("phone_number"),
                "location": p.get("location"),
            })
        print(f"  {detail['company']['name']}: {len(detail.get('profiles', []))} contact(s)")

    print("Loading into Supabase...")
    run_sql(build_upsert("sillage_companies", companies, ["mapping_id"]), supabase_token, SUPABASE_REF)
    if contacts:
        run_sql(build_upsert("sillage_contacts", contacts, ["id"]), supabase_token, SUPABASE_REF)

    print(f"Done. {len(companies)} companies, {len(contacts)} contacts.")


if __name__ == "__main__":
    main()
