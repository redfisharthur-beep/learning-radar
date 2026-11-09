"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/dashboard");
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";

  if (!email || !password) redirect("/login?error=missing");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed")) {
      redirect("/login?error=confirmation-enabled");
    }
    redirect("/login?error=credentials");
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !displayName || displayName.length > 60) {
    redirect("/register?error=invalid");
  }
  if (password.length < 6) redirect("/register?error=password");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      redirect("/register?error=exists");
    }
    redirect("/register?error=signup");
  }

  // With Supabase Auth "Confirm Email" disabled, signUp returns a session.
  // Do not claim signup is complete if the hosted Auth setting is still enabled.
  if (!data.session) {
    redirect("/register?error=confirmation-enabled");
  }

  // @supabase/ssr writes the new session into cookies through createClient().
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
