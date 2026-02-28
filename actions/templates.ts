"use server";

import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CanvasState } from "@/lib/canvas/types";
import { getDefaultCanvasState } from "@/lib/canvas/defaults";
import type { PresetKey } from "@/lib/settings";

export async function createTemplate(
  sectionId: string,
  presetKey: PresetKey,
  name?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const defaultState = getDefaultCanvasState(presetKey);

  const template = await db
    .insert(templates)
    .values({
      id: nanoid(),
      sectionId,
      name: name || "Untitled Template",
      canvasState: defaultState,
      isSelected: false,
    })
    .returning();

  return template[0];
}

export async function listTemplates(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(templates)
    .where(eq(templates.sectionId, sectionId));
}

export async function getTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const template = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!template[0]) throw new Error("Not found");
  return template[0];
}

export async function saveCanvasState(
  templateId: string,
  canvasState: CanvasState
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(templates)
    .set({ canvasState })
    .where(eq(templates.id, templateId));
}

export async function saveThumbnail(templateId: string, thumbnailUrl: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(templates)
    .set({ thumbnailUrl })
    .where(eq(templates.id, templateId));
}

export async function updateTemplateName(templateId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.update(templates).set({ name }).where(eq(templates.id, templateId));
}

export async function deleteTemplate(
  templateId: string,
  sectionId: string,
  projectId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(templates).where(eq(templates.id, templateId));
  revalidatePath(`/project/${projectId}/section/${sectionId}`);
}

export async function toggleTemplateSelected(
  templateId: string,
  isSelected: boolean
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(templates)
    .set({ isSelected })
    .where(eq(templates.id, templateId));
}
