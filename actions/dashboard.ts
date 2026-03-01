"use server";

import { db } from "@/lib/db";
import {
  projects,
  screenshotSections,
  screenshots,
  templates,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, count, inArray } from "drizzle-orm";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  const projectIds = userProjects.map((p) => p.id);

  let totalScreenshots = 0;
  let totalTemplates = 0;

  if (projectIds.length > 0) {
    const userSections = await db
      .select({ id: screenshotSections.id })
      .from(screenshotSections)
      .where(inArray(screenshotSections.projectId, projectIds));

    const sectionIds = userSections.map((s) => s.id);

    if (sectionIds.length > 0) {
      const scCount = await db
        .select({ count: count() })
        .from(screenshots)
        .where(inArray(screenshots.sectionId, sectionIds));
      totalScreenshots = scCount[0]?.count ?? 0;

      const tmplCount = await db
        .select({ count: count() })
        .from(templates)
        .where(inArray(templates.sectionId, sectionIds));
      totalTemplates = tmplCount[0]?.count ?? 0;
    }
  }

  return {
    totalProjects: userProjects.length,
    totalScreenshots,
    totalTemplates,
    recentProjects: userProjects.slice(0, 5),
  };
}
