import { ApiError } from "common-microservices-utils";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.config";
import { CreateContentBlockDTO, UpdateContentBlockDTO } from "./content.dto";

type FileMap = Record<
  string,
  {
    id: string;
    fileUploadType: string;
    fileMediaType: string;
    fileUrl: string;
    fileThumbnail: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
>;

async function resolveFileData(blocks: any[]): Promise<any[]> {
  const fileIds = new Set<string>();

  for (const block of blocks) {
    if (block.fileId) fileIds.add(block.fileId);
    for (const item of block.gridItems || []) {
      if (item.fileId) fileIds.add(item.fileId);
    }
    for (const item of block.imageItems || []) {
      if (item.fileId) fileIds.add(item.fileId);
    }
  }

  const fileMap: FileMap = {};

  if (fileIds.size > 0) {
    const files = await prisma.file.findMany({
      where: { id: { in: Array.from(fileIds) }, fileIsDelete: false },
    });
    for (const file of files) {
      fileMap[file.id] = file;
    }
  }

  console.log(fileMap, " here is fileMap");
  return blocks.map((block) => {
    const b = { ...block };
    b.file = b.fileId ? fileMap[b.fileId] || null : null;
    if (b.gridItems) {
      b.gridItems = b.gridItems.map((item: any) => ({
        ...item,
        file: item.fileId ? fileMap[item.fileId] || null : null,
      }));
    }
    if (b.imageItems) {
      b.imageItems = b.imageItems.map((item: any) => ({
        ...item,
        file: item.fileId ? fileMap[item.fileId] || null : null,
      }));
    }
    return b;
  });
}

export class ContentService {
  // Create content block for a page
  static async createContentBlock(data: CreateContentBlockDTO) {
    const page = await prisma.cmsPage.findUnique({
      where: { id: data.pageId },
    });

    if (!page) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    const contentBlock = await prisma.pageContentBlock.create({
      data: {
        pageId: data.pageId,
        blockType: data.blockType,
        title: data.title || null,
        content: data.content || null,
        fileUrl: data.fileUrl || null,
        fileId: data.fileId || null,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
        gridItems:
          data.gridItems && data.blockType === "GRID_TITLE"
            ? {
                create: data.gridItems.map((item) => ({
                  imageName: item.imageName || null,
                  imageUrl: item.imageUrl || null,
                  fileId: item.fileId || null,
                  designationName: item.designationName || null,
                  email: item.email || null,
                  sortOrder: item.sortOrder,
                })),
              }
            : undefined,
        imageItems:
          data.imageItems && data.blockType === "MULTIPLE_IMAGE_GRID"
            ? {
                create: data.imageItems.map((item) => ({
                  imageName: item.imageName || null,
                  imageUrl: item.imageUrl || null,
                  fileId: item.fileId || null,
                  designationName: item.designationName || null,
                  buttonLabel1: item.buttonLabel1 || null,
                  buttonLink1: item.buttonLink1 || null,
                  buttonLabel2: item.buttonLabel2 || null,
                  buttonLink2: item.buttonLink2 || null,
                  sortOrder: item.sortOrder,
                })),
              }
            : undefined,
      },
      include: {
        gridItems: {
          orderBy: { sortOrder: "asc" },
        },
        imageItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const resolved = await resolveFileData([contentBlock]);
    return resolved[0];
  }

  // Get all content blocks for a page
  static async getPageContent(pageId: string) {
    const page = await prisma.cmsPage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        pageName: true,
        slug: true,
        pageTitle: true,
      },
    });

    if (!page) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    const contentBlocks = await prisma.pageContentBlock.findMany({
      where: { pageId },
      include: {
        gridItems: {
          orderBy: { sortOrder: "asc" },
        },
        imageItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const resolved = await resolveFileData(contentBlocks);

    return {
      page,
      contentBlocks: resolved,
    };
  }

  // Get content by page slug (for frontend)
  static async getPageContentBySlug(slug: string) {
    const page = await prisma.cmsPage.findUnique({
      where: { slug },
      select: {
        id: true,
        pageName: true,
        slug: true,
        pageTitle: true,
        metaDescription: true,
        metaKeywords: true,
      },
    });

    if (!page) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    const contentBlocks = await prisma.pageContentBlock.findMany({
      where: {
        pageId: page.id,
        isPublished: true,
      },
      include: {
        gridItems: {
          orderBy: { sortOrder: "asc" },
        },
        imageItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const resolved = await resolveFileData(contentBlocks);

    return {
      page,
      contentBlocks: resolved,
    };
  }

  // Update content block
  static async updateContentBlock(id: string, data: UpdateContentBlockDTO) {
    const existingBlock = await prisma.pageContentBlock.findUnique({
      where: { id },
    });

    if (!existingBlock) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Content block not found");
    }

    if (data.gridItems) {
      await prisma.gridItem.deleteMany({
        where: { blockId: id },
      });
    }

    if (data.imageItems) {
      await prisma.multipleImageItem.deleteMany({
        where: { blockId: id },
      });
    }

    const updatedBlock = await prisma.pageContentBlock.update({
      where: { id },
      data: {
        blockType: data.blockType,
        title: data.title,
        content: data.content,
        fileUrl: data.fileUrl,
        fileId: data.fileId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
        gridItems: data.gridItems
          ? {
              create: data.gridItems.map((item) => ({
                imageName: item.imageName || null,
                imageUrl: item.imageUrl || null,
                fileId: item.fileId || null,
                designationName: item.designationName || null,
                email: item.email || null,
                sortOrder: item.sortOrder,
              })),
            }
          : undefined,
        imageItems: data.imageItems
          ? {
              create: data.imageItems.map((item) => ({
                imageName: item.imageName || null,
                imageUrl: item.imageUrl || null,
                fileId: item.fileId || null,
                designationName: item.designationName || null,
                buttonLabel1: item.buttonLabel1 || null,
                buttonLink1: item.buttonLink1 || null,
                buttonLabel2: item.buttonLabel2 || null,
                buttonLink2: item.buttonLink2 || null,
                sortOrder: item.sortOrder,
              })),
            }
          : undefined,
      },
      include: {
        gridItems: {
          orderBy: { sortOrder: "asc" },
        },
        imageItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const resolved = await resolveFileData([updatedBlock]);
    return resolved[0];
  }

  // Delete content block
  static async deleteContentBlock(id: string) {
    const block = await prisma.pageContentBlock.findUnique({
      where: { id },
    });

    if (!block) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Content block not found");
    }

    await prisma.pageContentBlock.delete({
      where: { id },
    });

    return { message: "Content block deleted successfully" };
  }

  // Reorder content blocks
  static async reorderContentBlocks(
    blocks: Array<{ id: string; sortOrder: number }>,
  ) {
    const operations = blocks.map(({ id, sortOrder }) =>
      prisma.pageContentBlock.update({
        where: { id },
        data: { sortOrder },
      }),
    );

    await prisma.$transaction(operations);

    return { message: "Content blocks reordered successfully" };
  }
}
