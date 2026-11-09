"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=missing");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!email || password.length < 6 || !displayName) redirect("/register?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } },
  });
  if (error) redirect("/register?error=signup");
  redirect("/login?message=check-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
