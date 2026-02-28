import { relations } from "drizzle-orm";
import { projects, screenshotSections, screenshots, templates } from "./schema";

export const projectsRelations = relations(projects, ({ many }) => ({
  sections: many(screenshotSections),
}));

export const screenshotSectionsRelations = relations(
  screenshotSections,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [screenshotSections.projectId],
      references: [projects.id],
    }),
    screenshots: many(screenshots),
    templates: many(templates),
  })
);

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  section: one(screenshotSections, {
    fields: [screenshots.sectionId],
    references: [screenshotSections.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  section: one(screenshotSections, {
    fields: [templates.sectionId],
    references: [screenshotSections.id],
  }),
}));
