"use server";

import { db } from "@/lib/db";
import { iconProjects } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CanvasState } from "@/lib/canvas/types";
import { getDefaultIconCanvasState } from "@/lib/canvas/defaults";
import { uploadBlob } from "@/lib/blob";

export async function createIconProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const size = parseInt(formData.get("size") as string) || 1024;

  const defaultState = getDefaultIconCanvasState(size);

  const project = await db
    .insert(iconProjects)
    .values({
      id: nanoid(),
      userId: session.user.id,
      name,
      description: description || null,
      size,
      canvasState: defaultState,
    })
    .returning();

  revalidatePath("/icon-generation");
  return project[0];
}

export async function listIconProjects() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(iconProjects)
    .where(eq(iconProjects.userId, session.user.id))
    .orderBy(desc(iconProjects.updatedAt));
}

export async function getIconProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await db
    .select()
    .from(iconProjects)
    .where(eq(iconProjects.id, id))
    .limit(1);

  if (!project[0] || project[0].userId !== session.user.id) {
    throw new Error("Not found");
  }

  return project[0];
}

export async function updateIconProject(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  await db
    .update(iconProjects)
    .set({ name, description: description || null })
    .where(eq(iconProjects.id, id));

  revalidatePath("/icon-generation");
  revalidatePath(`/icon-generation/project/${id}`);
}

export async function updateIconProjectSize(id: string, size: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get current state to re-scale elements
  const current = await db
    .select()
    .from(iconProjects)
    .where(eq(iconProjects.id, id))
    .limit(1);

  if (!current[0]) throw new Error("Not found");

  const oldState = current[0].canvasState;
  const oldSize = current[0].size;
  const scale = size / oldSize;

  let newState: CanvasState;
  if (oldState) {
    newState = {
      ...oldState,
      width: size,
      height: size,
      elements: oldState.elements.map((el) => ({
        ...el,
        x: el.x * scale,
        y: el.y * scale,
        width: el.width * scale,
        height: el.height * scale,
      })),
    };
  } else {
    newState = getDefaultIconCanvasState(size);
  }

  await db
    .update(iconProjects)
    .set({ size, canvasState: newState })
    .where(eq(iconProjects.id, id));

  revalidatePath(`/icon-generation/project/${id}`);
}

export async function deleteIconProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(iconProjects).where(eq(iconProjects.id, id));
  revalidatePath("/icon-generation");
}

export async function saveIconCanvasState(
  id: string,
  canvasState: CanvasState,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(iconProjects)
    .set({ canvasState })
    .where(eq(iconProjects.id, id));
}

export async function saveIconThumbnail(formData: FormData): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const file = formData.get("file") as File;

  const url = await uploadBlob(
    file,
    `icon-thumbnails/${session.user.id}/${id}.png`,
  );

  await db
    .update(iconProjects)
    .set({ thumbnailUrl: url })
    .where(eq(iconProjects.id, id));

  return url;
}

export async function saveIconAiMessages(id: string, messages: unknown[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = messages.slice(-20);

  await db
    .update(iconProjects)
    .set({ aiMessages: trimmed })
    .where(eq(iconProjects.id, id));
}
