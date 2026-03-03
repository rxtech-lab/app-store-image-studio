import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";

export async function AppSidebar() {
  const session = await auth();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center px-5">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-sidebar-foreground"
        >
          App Studio
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      <div className="flex-1 py-4">
        <SidebarNav />
      </div>

      <Separator className="bg-sidebar-border" />

      <div className="p-4">
        {session?.user && (
          <div className="flex flex-col gap-3">
            <div className="truncate text-sm text-sidebar-foreground/70">
              {session.user.name || session.user.email}
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
