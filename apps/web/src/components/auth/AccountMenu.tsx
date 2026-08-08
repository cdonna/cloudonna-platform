import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

/**
 * Server Component — reads the session once per render via
 * getCurrentUser() (which itself degrades to null, never throws, when
 * Supabase isn't configured). No client-side auth state duplicated here;
 * the account menu is exactly as current as the page it's rendered on.
 */
export async function AccountMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg border border-titanium bg-carbon px-3 py-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:border-titanium-strong hover:text-nova-ink"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden items-center gap-1.5 text-sm text-nova-ink-muted sm:inline-flex">
        <UserIcon size={14} />
        {user.email}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg border border-titanium bg-carbon px-3 py-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:border-red-500/40 hover:text-red-400"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </form>
    </div>
  );
}
