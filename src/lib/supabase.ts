import { createClient } from "@supabase/supabase-js";

// Supabase public credentials (anon key is safe to expose - RLS protects data)
const SUPABASE_URL = "https://aifjjukbulpoyrfawddd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmpqdWtidWxwb3lyZmF3ZGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjQ2NzEsImV4cCI6MjA4OTM0MDY3MX0.BN2kBKvUD7119ynyLubAIjfnMYSQjUZIZzpAIfsRsfo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
