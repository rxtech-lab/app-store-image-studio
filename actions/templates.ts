"use server";

import { db } from "@/lib/db";
import { templates, screenshotSections } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CanvasState } from "@/lib/canvas/types";
import { getDefaultCanvasState } from "@/lib/canvas/defaults";
import type { PresetKey } from "@/lib/settings";
import { uploadBlob } from "@/lib/blob";

export async function createTemplate(
  sectionId: string,
  presetKey: PresetKey | "custom",
  name?: string,
  customWidth?: number | null,
  customHeight?: number | null,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const defaultState = getDefaultCanvasState(
    presetKey,
    customWidth,
    customHeight,
  );

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

  return db.select().from(templates).where(eq(templates.sectionId, sectionId));
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
  canvasState: CanvasState,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(templates)
    .set({ canvasState })
    .where(eq(templates.id, templateId));

  // Revalidate the editor page so reloads reflect latest state
  const row = await db
    .select({ sectionId: templates.sectionId })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);
  if (row[0]) {
    const section = await db
      .select({ projectId: screenshotSections.projectId })
      .from(screenshotSections)
      .where(eq(screenshotSections.id, row[0].sectionId))
      .limit(1);
    if (section[0]) {
      revalidatePath(
        `/appstore-marketing-image/project/${section[0].projectId}/section/${row[0].sectionId}`,
      );
    }
  }
}

export async function saveThumbnail(templateId: string, thumbnailUrl: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(templates)
    .set({ thumbnailUrl })
    .where(eq(templates.id, templateId));
}

export async function saveTemplateThumbnail(
  templateId: string,
  dataUrl: string,
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const file = new File([buffer], `thumb-${templateId}.png`, {
    type: "image/png",
  });

  const url = await uploadBlob(
    file,
    `thumbnails/${session.user.id}/${templateId}.png`,
  );

  await db
    .update(templates)
    .set({ thumbnailUrl: url })
    .where(eq(templates.id, templateId));

  return url;
}

export async function updateTemplateName(templateId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.update(templates).set({ name }).where(eq(templates.id, templateId));
}

export async function deleteTemplate(
  templateId: string,
  sectionId: string,
  projectId: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(templates).where(eq(templates.id, templateId));
  revalidatePath(
    `/appstore-marketing-image/project/${projectId}/section/${sectionId}`,
  );
}

export async function uploadBackgroundImage(
  formData: FormData,
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const url = await uploadBlob(
    file,
    `backgrounds/${session.user.id}/${nanoid()}-${file.name}`,
  );
  return url;
}

export async function saveAiMessages(templateId: string, messages: unknown[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Keep only the last 20 messages
  const trimmed = messages.slice(-20);

  await db
    .update(templates)
    .set({ aiMessages: trimmed })
    .where(eq(templates.id, templateId));
}

export async function toggleTemplateSelected(
  templateId: string,
  isSelected: boolean,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(templates)
    .set({ isSelected })
    .where(eq(templates.id, templateId));
}
