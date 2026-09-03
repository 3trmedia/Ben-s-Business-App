import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "empowertherebel@gmail.com";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email !== OWNER_EMAIL) {
    await supabase.auth.signOut();
    redirect("/login?error=not_authorized");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/95 px-5 py-3 backdrop-blur"
        style={{ paddingTop: "calc(12px + var(--safe-top))" }}
      >
        <span className="font-display text-lg font-medium text-text">
          Business Ops
        </span>
        <SignOutButton />
      </header>

      <main className="flex-1 overflow-y-auto pb-[calc(72px+var(--safe-bottom))]">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
