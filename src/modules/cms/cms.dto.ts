import { z } from "zod";

// Helper to clean UUID fields
const cleanUuidField = z.preprocess((val) => {
  if (val === "" || val === undefined || val === "null" || val === null) {
    return null;
  }
  return val;
}, z.string().uuid().nullable());

export const CreatePageSchema = z.object({
  pageName: z.string().min(1).max(255),
  section: z.enum(["MAIN", "SCHOOL"]),
  parentId: cleanUuidField.optional(),
  slug: z.string().max(255),
  pageOrder: z.number().int(),
  pageType: z.enum(["TOP", "NONE"]).default("NONE"),
  contentType: z.enum(["CONTENT_PAGE", "URL"]).default("CONTENT_PAGE"),
  externalUrl: z.string().url().nullable().optional(),
  pageTitle: z.string().min(1).max(255),
  metaDescription: z.string().max(500).nullable().optional(),
  metaKeywords: z.string().max(500).nullable().optional(),
  isPublished: z.boolean().default(false),
  target: z.enum(["SELF", "NEW"]).default("SELF"),
  schoolId: cleanUuidField.optional(),
  category: z
    .enum(["HOME", "SCHOOL", "NORMAL"])
    .default("NORMAL"),
});

export const UpdatePageSchema = z.object({
  pageName: z.string().min(1).max(255).optional(),
  section: z.enum(["MAIN", "SCHOOL"]).optional(),
  parentId: cleanUuidField.optional(),
  pageType: z.enum(["TOP", "NONE"]).optional(),
  contentType: z.enum(["CONTENT_PAGE", "URL"]).optional(),
  externalUrl: z.string().url().nullable().optional(),
  pageTitle: z.string().min(1).max(255).optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  metaKeywords: z.string().max(500).nullable().optional(),
  isPublished: z.boolean().optional(),
  target: z.enum(["SELF", "NEW"]).optional(),
  schoolId: cleanUuidField.optional(),
  category: z
    .enum(["HOME", "SCHOOL", "NORMAL"])
    .optional(),
  pageOrder: z.number().int().min(0).optional(),
});

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  section: z.enum(["MAIN", "SCHOOL"]).optional(),
  schoolId: z.string().uuid().optional(),
  category: z
    .enum(["HOME", "SCHOOL", "NORMAL"])
    .optional(),
  parentId: z.string().uuid().optional(),
  pageType: z.enum(["TOP", "NONE"]).optional(),
  isPublished: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["pageOrder", "createdAt", "pageName", "updatedAt"])
    .default("pageOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const ReorderPagesSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string().uuid(),
      pageOrder: z.number().int().min(0),
    }),
  ),
});

export type CreatePageDTO = z.infer<typeof CreatePageSchema>;
export type UpdatePageDTO = z.infer<typeof UpdatePageSchema>;
export type PageQueryDTO = z.infer<typeof PageQuerySchema>;
export type ReorderPagesDTO = z.infer<typeof ReorderPagesSchema>;
