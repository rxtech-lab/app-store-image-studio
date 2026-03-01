import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LoginBackground,
  LoginHeader,
  LoginCard,
} from "@/components/login-page";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <LoginBackground />

      <Link
        href="/"
        aria-label="Back to home"
        className="absolute top-6 left-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </Link>

      <LoginHeader />

      <LoginCard>
        <form
          action={async () => {
            "use server";
            await signIn("rxlab", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full h-11 text-sm font-medium">
            Sign in with RxLab
          </Button>
        </form>
      </LoginCard>
    </div>
  );
}
