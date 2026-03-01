"use server";

import { db } from "@/lib/db";
import { screenshotSections } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { PresetKey } from "@/lib/settings";

export async function createSection(projectId: string, presetKey: PresetKey) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get max order
  const existing = await db
    .select({ order: screenshotSections.order })
    .from(screenshotSections)
    .where(eq(screenshotSections.projectId, projectId))
    .orderBy(asc(screenshotSections.order));

  const maxOrder =
    existing.length > 0 ? existing[existing.length - 1].order : -1;

  const section = await db
    .insert(screenshotSections)
    .values({
      id: nanoid(),
      projectId,
      presetKey,
      order: maxOrder + 1,
    })
    .returning();

  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
  return section[0];
}

export async function listSections(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(screenshotSections)
    .where(eq(screenshotSections.projectId, projectId))
    .orderBy(asc(screenshotSections.order));
}

export async function getSection(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const section = await db
    .select()
    .from(screenshotSections)
    .where(eq(screenshotSections.id, sectionId))
    .limit(1);

  if (!section[0]) throw new Error("Not found");
  return section[0];
}

export async function deleteSection(sectionId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(screenshotSections)
    .where(eq(screenshotSections.id, sectionId));

  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
}

export async function updateSectionPreset(
  sectionId: string,
  projectId: string,
  presetKey: PresetKey,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(screenshotSections)
    .set({ presetKey })
    .where(eq(screenshotSections.id, sectionId));

  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
}
