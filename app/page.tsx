import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">App Store Image Generator</h1>
        <p className="text-muted-foreground text-lg">
          Create stunning marketing images for the App Store with AI
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/login">Get Started</Link>
      </Button>
    </div>
  );
}
