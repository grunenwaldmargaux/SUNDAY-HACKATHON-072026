#!/usr/bin/env python3
"""Pull Salesforce accounts/opportunities/tasks for the 4 UK reps and load into Supabase.

Scope:
  - sf_accounts: UK active customers (company-wide, for the "similar accounts" feature)
                 + accounts tied to the 4 reps' open opportunities (prospects)
                 + ancestor accounts (hierarchy context), tagged via account_role
  - sf_opportunities: open opportunities owned by the 4 reps (UK accounts), with
                       Business/Holding record type and holding-opp linkage
  - sf_tasks: last 90 days of activity owned by the 4 reps (contact touchpoints)
"""
import json
import os
import subprocess
import urllib.request

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
SF_ORG = "SF-PROD"

REPS = {
    "Macarena Cibran Rosado": "005W500000JBFyTIAX",
    "Natalia Sanz Dawson": "005W500000ArkGfIAJ",
    "Virginia Guglielmi": "005W500000GI753IAD",
    "Kim Machipisa": "005W500000JBFyVIAX",
}
REP_IDS = "'" + "','".join(REPS.values()) + "'"


def load_env():
    env = {}
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v
    return env


def sf_query(soql):
    result = subprocess.run(
        ["sf", "data", "query", "-o", SF_ORG, "--query", soql, "--json"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)["result"]["records"]


def sql_str(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def run_sql(query, access_token, project_ref):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


HIGHTOUCH_FIELDS = {
    "L3M_Average_Monthly_NR__c": ("l3m_average_monthly_nr", "numeric"),
    "Last_transaction_processed_with_sunday__c": ("last_transaction_date", "date"),
    "GTV_Best_Month_Ever__c": ("gtv_best_month_ever", "numeric"),
    "Live_Date__c": ("live_date", "date"),
    "GTV_Best_Week_Ever__c": ("gtv_best_week_ever", "numeric"),
    "Adoption_4_Previous_Weeks__c": ("adoption_4_previous_weeks", "numeric"),
    "Turnover_4_Previous_Weeks__c": ("turnover_4_previous_weeks", "numeric"),
    "Connected_Activities_L28D__c": ("connected_activities_l28d", "numeric"),
    "Connected_Activities_L84D__c": ("connected_activities_l84d", "numeric"),
    "Not_Connected_Activities_L28D__c": ("not_connected_activities_l28d", "numeric"),
    "Not_Connected_Activities_L84D__c": ("not_connected_activities_l84d", "numeric"),
    "GTV_Last_Month__c": ("gtv_last_month", "numeric"),
    "GTV_Last_Week__c": ("gtv_last_week", "numeric"),
    "Adoption_Last_Month__c": ("adoption_last_month", "numeric"),
    "Adoption_Last_Week__c": ("adoption_last_week", "numeric"),
    "Real_Turnover_Last_Month__c": ("real_turnover_last_month", "numeric"),
    "Real_Turnover_Last_Week__c": ("real_turnover_last_week", "numeric"),
    "GTV_Evolution_Percent__c": ("gtv_evolution_percent", "numeric"),
    "Net_Revenue_Best_Month_Ever__c": ("net_revenue_best_month_ever", "numeric"),
    "Net_Revenue_Best_Week_Ever__c": ("net_revenue_best_week_ever", "numeric"),
    "Adoption_2_months_ago__c": ("adoption_2_months_ago", "numeric"),
    "Current_Month_Adoption__c": ("current_month_adoption", "numeric"),
    "Current_Month_GTV__c": ("current_month_gtv", "numeric"),
    "Current_Month_Net_Revenue__c": ("current_month_net_revenue", "numeric"),
    "Current_Week_Adoption__c": ("current_week_adoption", "numeric"),
    "Current_Week_GTV__c": ("current_week_gtv", "numeric"),
    "Current_Week_Net_Revenue__c": ("current_week_net_revenue", "numeric"),
    "Last_Month_Net_Revenue__c": ("last_month_net_revenue", "numeric"),
    "Last_Week_Net_Revenue__c": ("last_week_net_revenue", "numeric"),
    "Best_Month_Adoption__c": ("best_month_adoption", "numeric"),
    "Best_Week_Adoption__c": ("best_week_adoption", "numeric"),
    "Best_Week_GTV_Date__c": ("best_week_gtv_date", "date"),
    "Best_Month_GTV_Date__c": ("best_month_gtv_date", "date"),
    "Best_Month_Net_Revenue_Date__c": ("best_month_net_revenue_date", "date"),
    "Best_Week_Net_Revenue_Date__c": ("best_week_net_revenue_date", "date"),
    "Best_Week_Adoption_Date__c": ("best_week_adoption_date", "date"),
    "Best_Month_Adoption_Date__c": ("best_month_adoption_date", "date"),
    "Active_EMNR__c": ("active_emnr", "numeric"),
}

ADOPTION_METRICS_SCHEMA = "create table if not exists sf_account_adoption_metrics (\n    account_id text primary key,\n" + \
    ",\n".join(f"    {col} {typ}" for col, typ in HIGHTOUCH_FIELDS.values()) + \
    ",\n    loaded_at timestamptz default now()\n);\n"

SCHEMA_SQL = """
create table if not exists sf_accounts (
    id text primary key,
    name text,
    owner_id text,
    owner_email text,
    parent_id text,
    highest_parent_id text,
    billing_country text,
    billing_city text,
    billing_postal_code text,
    industry text,
    number_of_employees int,
    range_of_employees text,
    annual_turnover numeric,
    average_yearly_turnover numeric,
    venue_type text,
    ai_restaurant_type text,
    number_of_locations numeric,
    stage text,
    pos text,
    is_holding boolean,
    ai_research text,
    ai_sunday_fit text,
    ai_signals text,
    ai_summary text,
    ai_agent_score numeric,
    ai_agent_reasoning text,
    ai_agent_timestamp timestamptz,
    ai_group_identification text,
    account_role text,
    loaded_at timestamptz default now()
);

create table if not exists sf_opportunities (
    id text primary key,
    name text,
    account_id text,
    owner_id text,
    owner_email text,
    record_type text,
    opportunity_type text,
    stage_name text,
    amount numeric,
    close_date date,
    related_holding_opp_id text,
    parent_account_field_id text,
    created_date date,
    loaded_at timestamptz default now()
);

create table if not exists sf_tasks (
    id text primary key,
    who_id text,
    what_id text,
    owner_id text,
    owner_email text,
    activity_date date,
    subject text,
    status text,
    task_subtype text,
    type text,
    created_date timestamptz,
    loaded_at timestamptz default now()
);

create table if not exists sf_opportunity_products (
    id text primary key,
    opportunity_id text,
    product2_id text,
    product_code text,
    product_name text,
    product_type text,
    quantity numeric,
    unit_price numeric,
    list_price numeric,
    total_price numeric,
    estimated_monthly_net_revenue numeric,
    estimated_gtv numeric,
    currency text,
    loaded_at timestamptz default now()
);

create table if not exists sf_assets (
    id text primary key,
    account_id text,
    opportunity_product_id text,
    opportunity_id text,
    product2_id text,
    product_code text,
    product_name text,
    product_type text,
    status text,
    install_date date,
    onboarding_date date,
    price numeric,
    quantity numeric,
    currency text,
    core_product boolean,
    account_tier text,
    account_status text,
    loaded_at timestamptz default now()
);
""" + ADOPTION_METRICS_SCHEMA


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


ACCOUNT_FIELDS = (
    "Id, Name, OwnerId, Owner.Email, ParentId, Highest_Parent_Account_ID__c, "
    "BillingCountry, BillingCity, BillingPostalCode, Industry, NumberOfEmployees, "
    "Range_of_employees__c, Annual_Turnover__c, Average_yearly_turnover__c, "
    "Venue_type__c, AI_Restaurant_Type__c, Number_of_locations__c, Stage__c, POS_new__c, "
    "IsHolding__c, AI_Research__c, AI_sunday_Fit__c, AI_Signals__c, AI_Summary__c, "
    "AI_Agent_Score__c, AI_Agent_Reasoning__c, AI_Agent_Timestamp__c, AI_Group_Identification__c"
)


def account_row(r, role):
    return {
        "id": r["Id"],
        "name": r["Name"],
        "owner_id": r["OwnerId"],
        "owner_email": (r.get("Owner") or {}).get("Email"),
        "parent_id": r.get("ParentId"),
        "highest_parent_id": r.get("Highest_Parent_Account_ID__c"),
        "billing_country": r.get("BillingCountry"),
        "billing_city": r.get("BillingCity"),
        "billing_postal_code": r.get("BillingPostalCode"),
        "industry": r.get("Industry"),
        "number_of_employees": r.get("NumberOfEmployees"),
        "range_of_employees": r.get("Range_of_employees__c"),
        "annual_turnover": r.get("Annual_Turnover__c"),
        "average_yearly_turnover": r.get("Average_yearly_turnover__c"),
        "venue_type": r.get("Venue_type__c"),
        "ai_restaurant_type": r.get("AI_Restaurant_Type__c"),
        "number_of_locations": r.get("Number_of_locations__c"),
        "stage": r.get("Stage__c"),
        "pos": r.get("POS_new__c"),
        "is_holding": r.get("IsHolding__c"),
        "ai_research": r.get("AI_Research__c"),
        "ai_sunday_fit": r.get("AI_sunday_Fit__c"),
        "ai_signals": r.get("AI_Signals__c"),
        "ai_summary": r.get("AI_Summary__c"),
        "ai_agent_score": r.get("AI_Agent_Score__c"),
        "ai_agent_reasoning": r.get("AI_Agent_Reasoning__c"),
        "ai_agent_timestamp": r.get("AI_Agent_Timestamp__c"),
        "ai_group_identification": r.get("AI_Group_Identification__c"),
        "account_role": role,
    }


def main():
    env = load_env()
    access_token = env["SUPABASE_ACCESS_TOKEN"]
    project_ref = "jvmebywlusemucgbomgl"

    print("Creating schema...")
    run_sql(SCHEMA_SQL, access_token, project_ref)

    print("Querying customer accounts (UK, company-wide, Active/Partially Active/Onboarding)...")
    customer_recs = sf_query(
        f"SELECT {ACCOUNT_FIELDS} FROM Account "
        "WHERE BillingCountry = 'United Kingdom' "
        "AND Stage__c IN ('Active','Partially Active','Onboarding')"
    )
    accounts = {r["Id"]: account_row(r, "customer") for r in customer_recs}
    print(f"  {len(accounts)} customer accounts")

    print("Querying open opportunities for the 4 reps (UK accounts)...")
    opp_recs = sf_query(
        "SELECT Id, Name, AccountId, OwnerId, Owner.Email, RecordType.Name, Type, "
        "StageName, Amount, CloseDate, Related_Holding_Opp__c, Parent_Account__c, CreatedDate "
        f"FROM Opportunity WHERE OwnerId IN ({REP_IDS}) AND IsClosed = false "
        "AND Account.BillingCountry = 'United Kingdom'"
    )
    opportunities = [{
        "id": r["Id"],
        "name": r["Name"],
        "account_id": r.get("AccountId"),
        "owner_id": r["OwnerId"],
        "owner_email": (r.get("Owner") or {}).get("Email"),
        "record_type": (r.get("RecordType") or {}).get("Name"),
        "opportunity_type": r.get("Type"),
        "stage_name": r.get("StageName"),
        "amount": r.get("Amount"),
        "close_date": r.get("CloseDate"),
        "related_holding_opp_id": r.get("Related_Holding_Opp__c"),
        "parent_account_field_id": r.get("Parent_Account__c"),
        "created_date": r.get("CreatedDate"),
    } for r in opp_recs]
    print(f"  {len(opportunities)} open opportunities")

    prospect_account_ids = {o["account_id"] for o in opportunities if o["account_id"]}
    missing_prospect_ids = prospect_account_ids - set(accounts.keys())
    if missing_prospect_ids:
        print(f"Querying {len(missing_prospect_ids)} prospect accounts...")
        id_list = "'" + "','".join(missing_prospect_ids) + "'"
        prospect_recs = sf_query(f"SELECT {ACCOUNT_FIELDS} FROM Account WHERE Id IN ({id_list})")
        for r in prospect_recs:
            accounts[r["Id"]] = account_row(r, "prospect")

    ancestor_ids = set()
    for a in accounts.values():
        if a["parent_id"]:
            ancestor_ids.add(a["parent_id"])
        if a["highest_parent_id"]:
            ancestor_ids.add(a["highest_parent_id"])
    ancestor_ids -= set(accounts.keys())
    if ancestor_ids:
        print(f"Querying {len(ancestor_ids)} ancestor (parent/holding) accounts...")
        id_list = "'" + "','".join(ancestor_ids) + "'"
        ancestor_recs = sf_query(f"SELECT {ACCOUNT_FIELDS} FROM Account WHERE Id IN ({id_list})")
        for r in ancestor_recs:
            accounts[r["Id"]] = account_row(r, "parent")

    print(f"Total accounts to load: {len(accounts)}")

    print("Querying tasks (last 90 days) for the 4 reps...")
    task_recs = sf_query(
        "SELECT Id, WhoId, WhatId, OwnerId, Owner.Email, ActivityDate, Subject, Status, "
        f"TaskSubtype, Type, CreatedDate FROM Task WHERE OwnerId IN ({REP_IDS}) "
        "AND ActivityDate = LAST_N_DAYS:90"
    )
    tasks = [{
        "id": r["Id"],
        "who_id": r.get("WhoId"),
        "what_id": r.get("WhatId"),
        "owner_id": r["OwnerId"],
        "owner_email": (r.get("Owner") or {}).get("Email"),
        "activity_date": r.get("ActivityDate"),
        "subject": r.get("Subject"),
        "status": r.get("Status"),
        "task_subtype": r.get("TaskSubtype"),
        "type": r.get("Type"),
        "created_date": r.get("CreatedDate"),
    } for r in task_recs]
    print(f"  {len(tasks)} tasks")

    print("Querying opportunity products for open opportunities...")
    opp_ids = [o["id"] for o in opportunities]
    opp_products = []
    if opp_ids:
        id_list = "'" + "','".join(opp_ids) + "'"
        oli_recs = sf_query(
            "SELECT Id, OpportunityId, Product2Id, ProductCode, Product_Name__c, Product_Type__c, "
            "Quantity, UnitPrice, ListPrice, TotalPrice, Estimated_Monthly_Net_Revenue__c, "
            f"Estimated_GTV__c, CurrencyIsoCode FROM OpportunityLineItem WHERE OpportunityId IN ({id_list})"
        )
        opp_products = [{
            "id": r["Id"],
            "opportunity_id": r.get("OpportunityId"),
            "product2_id": r.get("Product2Id"),
            "product_code": r.get("ProductCode"),
            "product_name": r.get("Product_Name__c"),
            "product_type": r.get("Product_Type__c"),
            "quantity": r.get("Quantity"),
            "unit_price": r.get("UnitPrice"),
            "list_price": r.get("ListPrice"),
            "total_price": r.get("TotalPrice"),
            "estimated_monthly_net_revenue": r.get("Estimated_Monthly_Net_Revenue__c"),
            "estimated_gtv": r.get("Estimated_GTV__c"),
            "currency": r.get("CurrencyIsoCode"),
        } for r in oli_recs]
    print(f"  {len(opp_products)} opportunity products")

    print("Querying assets for customer accounts...")
    customer_ids = [a["id"] for a in accounts.values() if a["account_role"] == "customer"]
    assets = []
    if customer_ids:
        id_list = "'" + "','".join(customer_ids) + "'"
        asset_recs = sf_query(
            "SELECT Id, AccountId, Opportunity_Product__c, Opportunity__c, Product2Id, ProductCode, "
            "Product_Name__c, Product_Type__c, Status, InstallDate, Onboarding_Date__c, Price, Quantity, "
            f"CurrencyIsoCode, Core_Product__c, Account_Tier__c, Account_Status__c FROM Asset WHERE AccountId IN ({id_list})"
        )
        assets = [{
            "id": r["Id"],
            "account_id": r.get("AccountId"),
            "opportunity_product_id": r.get("Opportunity_Product__c"),
            "opportunity_id": r.get("Opportunity__c"),
            "product2_id": r.get("Product2Id"),
            "product_code": r.get("ProductCode"),
            "product_name": r.get("Product_Name__c"),
            "product_type": r.get("Product_Type__c"),
            "status": r.get("Status"),
            "install_date": r.get("InstallDate"),
            "onboarding_date": r.get("Onboarding_Date__c"),
            "price": r.get("Price"),
            "quantity": r.get("Quantity"),
            "currency": r.get("CurrencyIsoCode"),
            "core_product": r.get("Core_Product__c"),
            "account_tier": r.get("Account_Tier__c"),
            "account_status": r.get("Account_Status__c"),
        } for r in asset_recs]
    print(f"  {len(assets)} assets")

    print("Querying Hightouch adoption metrics for all loaded accounts...")
    adoption_metrics = []
    all_account_ids = list(accounts.keys())
    ht_fields = ", ".join(HIGHTOUCH_FIELDS.keys())
    for i in range(0, len(all_account_ids), 300):
        batch = all_account_ids[i:i + 300]
        id_list = "'" + "','".join(batch) + "'"
        recs = sf_query(f"SELECT Id, {ht_fields} FROM Account WHERE Id IN ({id_list})")
        for r in recs:
            row = {"account_id": r["Id"]}
            for api_name, (col, _) in HIGHTOUCH_FIELDS.items():
                row[col] = r.get(api_name)
            adoption_metrics.append(row)
    print(f"  {len(adoption_metrics)} adoption metric rows")

    print("Loading accounts...")
    account_rows = list(accounts.values())
    for i in range(0, len(account_rows), 500):
        run_sql(build_upsert("sf_accounts", account_rows[i:i + 500], ["id"]), access_token, project_ref)

    print("Loading opportunities...")
    for i in range(0, len(opportunities), 500):
        run_sql(build_upsert("sf_opportunities", opportunities[i:i + 500], ["id"]), access_token, project_ref)

    print("Loading tasks...")
    for i in range(0, len(tasks), 500):
        run_sql(build_upsert("sf_tasks", tasks[i:i + 500], ["id"]), access_token, project_ref)

    print("Loading opportunity products...")
    for i in range(0, len(opp_products), 500):
        run_sql(build_upsert("sf_opportunity_products", opp_products[i:i + 500], ["id"]), access_token, project_ref)

    print("Loading assets...")
    for i in range(0, len(assets), 500):
        run_sql(build_upsert("sf_assets", assets[i:i + 500], ["id"]), access_token, project_ref)

    print("Loading adoption metrics...")
    for i in range(0, len(adoption_metrics), 300):
        run_sql(build_upsert("sf_account_adoption_metrics", adoption_metrics[i:i + 300], ["account_id"]), access_token, project_ref)

    print("Done.")


if __name__ == "__main__":
    main()
