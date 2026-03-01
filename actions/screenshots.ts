"use server";

import { db } from "@/lib/db";
import { screenshots } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadBlob, deleteBlob } from "@/lib/blob";

export async function uploadScreenshot(
  sectionId: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const id = nanoid();
  const imageUrl = await uploadBlob(
    file,
    `screenshots/${session.user.id}/${id}-${file.name}`,
  );

  // Get max order
  const existing = await db
    .select({ order: screenshots.order })
    .from(screenshots)
    .where(eq(screenshots.sectionId, sectionId))
    .orderBy(asc(screenshots.order));

  const maxOrder =
    existing.length > 0 ? existing[existing.length - 1].order : -1;

  const screenshot = await db
    .insert(screenshots)
    .values({
      id,
      sectionId,
      imageUrl,
      originalFilename: file.name,
      order: maxOrder + 1,
    })
    .returning();

  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
  return screenshot[0];
}

export async function listScreenshots(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(screenshots)
    .where(eq(screenshots.sectionId, sectionId))
    .orderBy(asc(screenshots.order));
}

export async function deleteScreenshot(
  screenshotId: string,
  projectId: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db
    .select()
    .from(screenshots)
    .where(eq(screenshots.id, screenshotId))
    .limit(1);

  if (existing[0]) {
    await deleteBlob(existing[0].imageUrl);
    await db.delete(screenshots).where(eq(screenshots.id, screenshotId));
  }

  revalidatePath(`/appstore-marketing-image/project/${projectId}`);
}
