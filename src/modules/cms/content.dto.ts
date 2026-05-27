import { z } from "zod";

// Grid Item Schema
export const GridItemSchema = z.object({
  imageName: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
  designationName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

// Multiple Image Item Schema
export const MultipleImageItemSchema = z.object({
  imageName: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
  designationName: z.string().optional().nullable(),
  buttonLabel1: z.string().optional().nullable(),
  buttonLink1: z.string().url().optional().nullable(),
  buttonLabel2: z.string().optional().nullable(),
  buttonLink2: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

// Create Content Block Schema
export const CreateContentBlockSchema = z.object({
  pageId: z.string().uuid(),
  blockType: z.enum([
    "TITLE",
    "PARAGRAPH",
    "RICH_TEXT",
    "SINGLE_FILE",
    "GRID_TITLE",
    "MULTIPLE_IMAGE_GRID",
  ]),
  title: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  gridItems: z.array(GridItemSchema).optional(),
  imageItems: z.array(MultipleImageItemSchema).optional(),
});

// Update Content Block Schema
export const UpdateContentBlockSchema = z.object({
  blockType: z
    .enum([
      "TITLE",
      "PARAGRAPH",
      "RICH_TEXT",
      "SINGLE_FILE",
      "GRID_TITLE",
      "MULTIPLE_IMAGE_GRID",
    ])
    .optional(),
  title: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  gridItems: z.array(GridItemSchema).optional(),
  imageItems: z.array(MultipleImageItemSchema).optional(),
});

export const ContentBlockQuerySchema = z.object({
  pageId: z.string().uuid(),
  blockType: z
    .enum([
      "TITLE",
      "PARAGRAPH",
      "RICH_TEXT",
      "SINGLE_FILE",
      "GRID_TITLE",
      "MULTIPLE_IMAGE_GRID",
    ])
    .optional(),
  isPublished: z.boolean().optional(),
});

export type CreateContentBlockDTO = z.infer<typeof CreateContentBlockSchema>;
export type UpdateContentBlockDTO = z.infer<typeof UpdateContentBlockSchema>;
