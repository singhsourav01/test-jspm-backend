import { ApiError } from "common-microservices-utils";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.config";
import { SlugService } from "./slug.service";
import {
  CreatePageDTO,
  UpdatePageDTO,
  PageQueryDTO,
  ReorderPagesDTO,
} from "./cms.dto";
import { Prisma, PageCategory } from "@prisma/client";

export class CmsService {
  // Create a new page
  static async createPage(data: CreatePageDTO) {
    // ─── Case 1 & 2: TOP pages (Home / School root pages) ───
    // page_type = TOP, parent_id = null, school_id = null/empty
    if (data.pageType === "TOP") {
      // TOP pages must be root-level (no parent)
      if (data.parentId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "TOP pages cannot have a parent. They must be root-level pages.",
        );
      }

      // TOP pages must not have a school_id
      if (data.schoolId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "TOP pages cannot be assigned to a school. Set schoolId to null or empty.",
        );
      }

      // TOP pages must be either HOME or SCHOOL category
      if (data.category !== "HOME" && data.category !== "SCHOOL") {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "TOP pages must have category HOME or SCHOOL.",
        );
      }

      // Ensure only one root page per category (HOME / SCHOOL)
      // const existingRoot = await prisma.cmsPage.findFirst({
      //   where: {
      //     pageType: "TOP",
      //     parentId: null,
      //     category: data.category,
      //   },
      // });

      // if (existingRoot) {
      //   throw new ApiError(
      //     StatusCodes.CONFLICT,
      //     `A root ${data.category} page already exists. Only one TOP-level ${data.category} page is allowed.`,
      //   );
      // }
    }

    // ─── Case 3: NONE pages (Normal pages) ───
    if (data.pageType === "NONE") {
      // NONE pages must have category NORMAL
      if (data.category && data.category !== "NORMAL") {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Pages with pageType NONE must have category NORMAL.",
        );
      }
      // Force category to NORMAL
      data.category = "NORMAL";
    }

    // Validate section-specific requirements
    if (data.section === "SCHOOL" && !data.schoolId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "School is required for SCHOOL section pages",
      );
    }

    // If creating under a fixed nav page, validate parent exists
    if (data.parentId) {
      const parent = await prisma.cmsPage.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parent page not found");
      }

      // Ensure parent belongs to same section
      if (parent.section !== data.section) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Parent page must belong to same section",
        );
      }
    }

    // Validate school exists if provided
    if (data.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId },
      });
      if (!school) {
        throw new ApiError(StatusCodes.NOT_FOUND, "School not found");
      }
    }

    // Check duplicate page name under same parent
    const existingPage = await prisma.cmsPage.findFirst({
      where: {
        pageName: data.pageName,
        parentId: data.parentId || null,
        section: data.section,
      },
    });

    if (existingPage) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Page with this name already exists under the same parent",
      );
    }

    // Create page
    const page = await prisma.cmsPage.create({
      data,
      include: {
        parent: {
          select: { id: true, pageName: true, slug: true, category: true },
        },
        school: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: {
            id: true,
            pageName: true,
            slug: true,
            pageOrder: true,
            category: true,
          },
          orderBy: { pageOrder: "asc" },
        },
      },
    });

    return page;
  }

  // Get all pages with pagination and filters
  static async getPages(query: PageQueryDTO) {
    const {
      page,
      limit,
      section,
      schoolId,
      category,
      parentId,
      pageType,
      isPublished,
      search,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.CmsPageWhereInput = {
      ...(section && { section }),
      ...(schoolId && { schoolId }),
      ...(category && { category }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(pageType && { pageType }),
      ...(isPublished !== undefined && { isPublished }),
      ...(search && {
        OR: [
          { pageName: { contains: search } },
          { pageTitle: { contains: search } },
          { slug: { contains: search } },
        ],
      }),
    };

    const [pages, total] = await Promise.all([
      prisma.cmsPage.findMany({
        where,
        include: {
          parent: {
            select: { id: true, pageName: true, slug: true, category: true },
          },
          school: {
            select: { id: true, name: true, slug: true },
          },
          children: {
            select: { id: true, pageName: true, slug: true, pageOrder: true },
            orderBy: { pageOrder: "asc" },
            take: 5,
          },
          _count: {
            select: { children: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cmsPage.count(),
    ]);

    return {
      data: pages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Get main navigation pages (fixed pages: Home, About Us, etc.)
  static async getMainNavigation() {
    const [navPages, count] = await Promise.all([
      prisma.cmsPage.findMany({
        where: {
          section: "MAIN",
          category: {
            not: "NORMAL", // Get all fixed pages
          },
          parentId: null, // Only root level
        },
        include: {
          children: {
            where: { isPublished: true },
            include: {
              children: {
                where: { isPublished: true },
                select: {
                  id: true,
                  pageName: true,
                  slug: true,
                  pageType: true,
                  pageOrder: true,
                  category: true,
                },
              },
            },
            orderBy: { pageOrder: "asc" },
          },
        },
        orderBy: { pageOrder: "asc" },
      }),
      prisma.cmsPage.count(),
    ]);
    return {
      data: navPages,
      count,
    };
  }

  // Get normal pages (can be child of fixed nav or standalone)
  static async getNormalPages(query: PageQueryDTO) {
    const where: Prisma.CmsPageWhereInput = {
      category: "NORMAL",
      ...(query.section && { section: query.section }),
      ...(query.schoolId && { schoolId: query.schoolId }),
      ...(query.parentId !== undefined && { parentId: query.parentId || null }),
      ...(query.isPublished !== undefined && {
        isPublished: query.isPublished,
      }),
      ...(query.search && {
        OR: [
          { pageName: { contains: query.search } },
          { pageTitle: { contains: query.search } },
        ],
      }),
    };

    const [pages, total] = await Promise.all([
      prisma.cmsPage.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              pageName: true,
              slug: true,
              category: true,
            },
          },
          school: {
            select: { id: true, name: true, slug: true },
          },
          children: {
            select: {
              id: true,
              pageName: true,
              slug: true,
              pageOrder: true,
            },
            orderBy: { pageOrder: "asc" },
            take: 5,
          },
          _count: {
            select: { children: true },
          },
        },
        orderBy: { [query.sortBy || "pageOrder"]: query.sortOrder || "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.cmsPage.count({ where }),
    ]);

    return {
      data: pages,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  // Get single page by ID
  static async getPageById(id: string) {
    const page = await prisma.cmsPage.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, pageName: true, slug: true, category: true },
        },
        school: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: {
            id: true,
            pageName: true,
            slug: true,
            pageOrder: true,
            pageType: true,
            category: true,
          },
          orderBy: { pageOrder: "asc" },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    if (!page) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    return page;
  }

  // Get page hierarchy by category (Home, About Us, etc.)
  static async getPageHierarchyByCategory(category: PageCategory) {
    if (category === "NORMAL") {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Use getNormalPages for NORMAL category",
      );
    }

    const rootPage = await prisma.cmsPage.findFirst({
      where: {
        category,
        parentId: null,
        section: "MAIN",
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // 3 levels deep
              },
            },
          },
          orderBy: { pageOrder: "asc" },
        },
      },
    });

    if (!rootPage) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `No page found for category: ${category}`,
      );
    }

    return rootPage;
  }

  // Get school page hierarchy
  static async getSchoolHierarchy(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new ApiError(StatusCodes.NOT_FOUND, "School not found");
    }

    const pages = await prisma.cmsPage.findMany({
      where: {
        schoolId,
        parentId: null,
        section: "SCHOOL",
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
          orderBy: { pageOrder: "asc" },
        },
      },
      orderBy: { pageOrder: "asc" },
    });

    return {
      school,
      pages,
    };
  }

  // Update page
  static async updatePage(id: string, data: UpdatePageDTO) {
    const existingPage = await prisma.cmsPage.findUnique({ where: { id } });

    if (!existingPage) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    // Don't allow changing category of fixed pages
    if (
      existingPage.category !== "NORMAL" &&
      data.category &&
      data.category !== existingPage.category
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot change category of fixed navigation pages",
      );
    }

    // Check for duplicate name under same parent
    if (data.pageName) {
      const duplicate = await prisma.cmsPage.findFirst({
        where: {
          pageName: data.pageName,
          parentId: data.parentId || existingPage.parentId,
          section: data.section || existingPage.section,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "Page with this name already exists under the same parent",
        );
      }
    }

    // Generate new slug if page name or school changed
    let slug = existingPage.slug;
    if (data.pageName || data.schoolId) {
      slug = await SlugService.generateSlug(
        data.pageName || existingPage.pageName,
        data.schoolId || existingPage.schoolId,
      );
    }

    const updatedPage = await prisma.cmsPage.update({
      where: { id },
      data: {
        ...data,
        slug,
        parentId:
          data.parentId !== undefined ? data.parentId : existingPage.parentId,
        schoolId:
          data.schoolId !== undefined ? data.schoolId : existingPage.schoolId,
      },
      include: {
        parent: {
          select: { id: true, pageName: true, slug: true, category: true },
        },
        school: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, pageName: true, slug: true, pageOrder: true },
          orderBy: { pageOrder: "asc" },
        },
      },
    });

    return updatedPage;
  }

  // Delete page
  static async deletePage(id: string) {
    const page = await prisma.cmsPage.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });

    if (!page) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
    }

    // // Prevent deletion of fixed navigation pages
    // if (page.category !== "NORMAL") {
    //   throw new ApiError(
    //     StatusCodes.BAD_REQUEST,
    //     "Cannot delete fixed navigation pages",
    //   );
    // }

    await prisma.cmsPage.delete({ where: { id } });

    return { message: "Page deleted successfully" };
  }

  // Reorder pages
  static async reorderPages(data: ReorderPagesDTO) {
    const operations = data.pages.map(({ id, pageOrder }) =>
      prisma.cmsPage.update({
        where: { id },
        data: { pageOrder },
      }),
    );

    await prisma.$transaction(operations);

    return { message: "Pages reordered successfully" };
  }

  // Bulk publish/unpublish
  static async bulkUpdateStatus(ids: string[], isPublished: boolean) {
    await prisma.cmsPage.updateMany({
      where: { id: { in: ids } },
      data: { isPublished },
    });

    return {
      message: `Pages ${isPublished ? "published" : "unpublished"} successfully`,
    };
  }
}
