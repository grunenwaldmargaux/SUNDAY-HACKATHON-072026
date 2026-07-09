import type { DataSource } from "./types";
import { MockDataSource } from "./mock";
import { SupabaseDataSource } from "./supabase";
import { DEFAULT_REP_EMAIL } from "./supabaseSchema";

export type { DataSource } from "./types";

function createDataSource(): DataSource {
  const mode = import.meta.env.VITE_DATA_SOURCE ?? "mock";

  if (mode === "supabase") {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "VITE_DATA_SOURCE=supabase requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in app/.env.local",
      );
    }
    const repEmail = import.meta.env.VITE_REP_EMAIL || DEFAULT_REP_EMAIL;
    return new SupabaseDataSource(url, anonKey, repEmail);
  }

  return new MockDataSource();
}

export const dataSource: DataSource = createDataSource();
