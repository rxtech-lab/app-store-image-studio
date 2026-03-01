"use server";

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  const project = await db
    .insert(projects)
    .values({
      id: nanoid(),
      userId: session.user.id,
      name,
      description: description || null,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/appstore-marketing-image");
  return project[0];
}

export async function listProjects() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt));
}

export async function getProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project[0] || project[0].userId !== session.user.id) {
    throw new Error("Not found");
  }

  return project[0];
}

export async function updateProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  await db
    .update(projects)
    .set({ name, description: description || null })
    .where(eq(projects.id, projectId));

  revalidatePath("/dashboard");
  revalidatePath("/appstore-marketing-image");
  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
}

export async function updateProjectData(
  projectId: string,
  name: string,
  description: string | null,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(projects)
    .set({ name, description: description || null })
    .where(eq(projects.id, projectId));

  revalidatePath("/dashboard");
  revalidatePath("/appstore-marketing-image");
  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(projects).where(eq(projects.id, projectId));

  revalidatePath("/dashboard");
  revalidatePath("/appstore-marketing-image");
}
