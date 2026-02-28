import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppLayout } from "@/components/app-layout";

export default async function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppLayout sidebar={<AppSidebar />}>{children}</AppLayout>;
}
