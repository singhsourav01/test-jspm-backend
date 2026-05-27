import { z } from "zod";

export const CreateFileSchema = z.object({
  fileUploadType: z.enum([
    "single_image",
    "multiple_images",
    "single_file",
    "multiple_files",
    "editor_image",
  ]),
});

export const UpdateFileSchema = z.object({
  fileUploadType: z
    .enum([
      "single_image",
      "multiple_images",
      "single_file",
      "multiple_files",
      "editor_image",
    ])
    .optional(),
});

export const FileQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  fileUploadType: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateFileDTO = z.infer<typeof CreateFileSchema>;
export type UpdateFileDTO = z.infer<typeof UpdateFileSchema>;
export type FileQueryDTO = z.infer<typeof FileQuerySchema>;
