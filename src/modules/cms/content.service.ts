import { ApiError } from "common-microservices-utils";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.config";
import { CreateContentBlockDTO, UpdateContentBlockDTO } from "./content.dto";

export class ContentService {
  // Create content block for a page
  static async createContentBlock(data: CreateContentBlockDTO) {
    // Verify page exists
    const page = await prisma.cmsPage.findUnique({
      where: { id: data.pageId },
    });

    if (!page) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    // Create content block with optional grid items
    const contentBlock = await prisma.pageContentBlock.create({
      data: {
        pageId: data.pageId,
        blockType: data.blockType,
        title: data.title || null,
        content: data.content || null,
        fileUrl: data.fileUrl || null,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
        // Create grid items if block type is GRID_TITLE
        gridItems:
          data.gridItems && data.blockType === "GRID_TITLE"
            ? {
                create: data.gridItems.map((item) => ({
                  imageName: item.imageName || null,
                  imageUrl: item.imageUrl || null,
                  designationName: item.designationName || null,
                  email: item.email || null,
                  sortOrder: item.sortOrder,
                })),
              }
            : undefined,
        // Create image items if block type is MULTIPLE_IMAGE_GRID
        imageItems:
          data.imageItems && data.blockType === "MULTIPLE_IMAGE_GRID"
            ? {
                create: data.imageItems.map((item) => ({
                  imageName: item.imageName || null,
                  imageUrl: item.imageUrl || null,
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

    return contentBlock;
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
      where: {
        pageId,
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

    return {
      page,
      contentBlocks,
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

    return {
      page,
      contentBlocks,
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

    // Delete existing grid items if updating
    if (data.gridItems) {
      await prisma.gridItem.deleteMany({
        where: { blockId: id },
      });
    }

    // Delete existing image items if updating
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
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
        gridItems: data.gridItems
          ? {
              create: data.gridItems.map((item) => ({
                imageName: item.imageName || null,
                imageUrl: item.imageUrl || null,
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

    return updatedBlock;
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
