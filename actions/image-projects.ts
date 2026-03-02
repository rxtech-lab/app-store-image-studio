"use server";

import { db } from "@/lib/db";
import { imageProjects, generatedImages } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CanvasState } from "@/lib/canvas/types";
import { getDefaultImageCanvasState } from "@/lib/canvas/defaults";
import { uploadBlob, deleteBlob } from "@/lib/blob";

export async function createImageProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const width = parseInt(formData.get("width") as string) || 1024;
  const height = parseInt(formData.get("height") as string) || 1024;

  const project = await db
    .insert(imageProjects)
    .values({
      id: nanoid(),
      userId: session.user.id,
      name,
      description: description || null,
      width,
      height,
    })
    .returning();

  revalidatePath("/image-generation");
  return project[0];
}

export async function listImageProjects() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(imageProjects)
    .where(eq(imageProjects.userId, session.user.id))
    .orderBy(desc(imageProjects.updatedAt));
}

export async function getImageProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await db
    .select()
    .from(imageProjects)
    .where(eq(imageProjects.id, id))
    .limit(1);

  if (!project[0] || project[0].userId !== session.user.id) {
    throw new Error("Not found");
  }

  return project[0];
}

export async function updateImageProject(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  await db
    .update(imageProjects)
    .set({ name, description: description || null })
    .where(eq(imageProjects.id, id));

  revalidatePath("/image-generation");
  revalidatePath(`/image-generation/project/${id}`);
}

export async function updateImageProjectSize(
  id: string,
  width: number,
  height: number,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(imageProjects)
    .set({ width, height })
    .where(eq(imageProjects.id, id));

  revalidatePath(`/image-generation/project/${id}`);
}

export async function deleteImageProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(imageProjects).where(eq(imageProjects.id, id));
  revalidatePath("/image-generation");
}

export async function saveImageProjectCanvasState(
  id: string,
  canvasState: CanvasState,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(imageProjects)
    .set({ canvasState, width: canvasState.width, height: canvasState.height })
    .where(eq(imageProjects.id, id));
}

export async function saveImageProjectThumbnail(
  formData: FormData,
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const file = formData.get("file") as File;

  const url = await uploadBlob(
    file,
    `image-project-thumbnails/${session.user.id}/${id}.png`,
  );

  await db
    .update(imageProjects)
    .set({ thumbnailUrl: url })
    .where(eq(imageProjects.id, id));

  return url;
}

export async function saveImageProjectAiMessages(
  id: string,
  messages: unknown[],
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = messages.slice(-20);

  await db
    .update(imageProjects)
    .set({ aiMessages: trimmed })
    .where(eq(imageProjects.id, id));
}

// --- Generated Images CRUD ---

export async function addGeneratedImage(
  projectId: string,
  imageUrl: string,
  prompt: string,
  width: number,
  height: number,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const canvasState = getDefaultImageCanvasState(width, height);
  canvasState.backgroundImageUrl = imageUrl;

  const id = nanoid();
  const result = await db
    .insert(generatedImages)
    .values({
      id,
      projectId,
      imageUrl,
      canvasState,
      prompt,
    })
    .returning();

  revalidatePath(`/image-generation/project/${projectId}`);
  return result[0];
}

export async function listGeneratedImages(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.projectId, projectId))
    .orderBy(desc(generatedImages.createdAt));
}

export async function getGeneratedImage(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const image = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.id, id))
    .limit(1);

  if (!image[0]) throw new Error("Not found");

  // Verify ownership via project
  const project = await db
    .select()
    .from(imageProjects)
    .where(
      and(
        eq(imageProjects.id, image[0].projectId),
        eq(imageProjects.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!project[0]) throw new Error("Not found");

  return image[0];
}

export async function deleteGeneratedImage(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const image = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.id, id))
    .limit(1);

  if (image[0]) {
    try {
      await deleteBlob(image[0].imageUrl);
      if (image[0].thumbnailUrl) await deleteBlob(image[0].thumbnailUrl);
    } catch {
      // Ignore blob deletion errors
    }
    await db.delete(generatedImages).where(eq(generatedImages.id, id));
    revalidatePath(`/image-generation/project/${image[0].projectId}`);
  }
}

export async function saveGeneratedImageCanvasState(
  id: string,
  canvasState: CanvasState,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(generatedImages)
    .set({ canvasState })
    .where(eq(generatedImages.id, id));
}

export async function saveGeneratedImageThumbnail(
  formData: FormData,
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const file = formData.get("file") as File;

  const url = await uploadBlob(
    file,
    `image-gen-thumbnails/${session.user.id}/${id}.png`,
  );

  await db
    .update(generatedImages)
    .set({ thumbnailUrl: url })
    .where(eq(generatedImages.id, id));

  return url;
}

export async function saveGeneratedImageAiMessages(
  id: string,
  messages: unknown[],
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = messages.slice(-20);

  await db
    .update(generatedImages)
    .set({ aiMessages: trimmed })
    .where(eq(generatedImages.id, id));
}
