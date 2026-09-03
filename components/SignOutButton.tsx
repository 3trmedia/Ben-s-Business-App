"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      aria-label="Sign out"
      className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint transition-colors active:bg-surface-raised"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
