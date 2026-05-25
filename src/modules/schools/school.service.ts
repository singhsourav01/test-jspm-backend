import { ApiError } from "common-microservices-utils";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.config";
import { SlugService } from "../cms/slug.service";
import { CreateSchoolDTO, UpdateSchoolDTO, SchoolQueryDTO } from "./school.dto";
import { Prisma } from "@prisma/client";

export class SchoolService {
  // Create a new school
  static async createSchool(data: CreateSchoolDTO) {
    // Check if school name already exists
    const existingSchool = await prisma.school.findUnique({
      where: { name: data.name },
    });

    if (existingSchool) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "School with this name already exists",
      );
    }

    // Generate unique slug
    const slug = await SlugService.generateSchoolSlug(data.name);

    // Get the next sequence number

    const school = await prisma.school.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        isActive: data.isActive,
      },
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });

    return school;
  }

  // Get all schools with pagination
  static async getSchools(query: SchoolQueryDTO) {
    const { page, limit, isActive, search, sortBy, sortOrder } = query;

    const where: Prisma.SchoolWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          _count: {
            select: {
              pages: true,
            },
          },
          pages: {
            where: { pageType: "TOP" },
            select: {
              id: true,
              pageName: true,
              slug: true,
              pageOrder: true,
            },
            orderBy: { pageOrder: "asc" },
            take: 5, // Preview top navigation pages
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.school.count({ where }),
    ]);

    return {
      data: schools,
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

  // Get single school by ID
  static async getSchoolById(id: string) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pages: true },
        },
        pages: {
          where: { parentId: null }, // Get root pages only
          select: {
            id: true,
            pageName: true,
            slug: true,
            pageType: true,
            pageOrder: true,
            isPublished: true,
            children: {
              select: {
                id: true,
                pageName: true,
                slug: true,
                pageType: true,
                pageOrder: true,
              },
              orderBy: { pageOrder: "asc" },
            },
          },
          orderBy: { pageOrder: "asc" },
        },
      },
    });

    if (!school) {
      throw new ApiError(StatusCodes.NOT_FOUND, "School not found");
    }

    return school;
  }

  // Get school by slug
  static async getSchoolBySlug(slug: string) {
    const school = await prisma.school.findUnique({
      where: { slug },
      include: {
        pages: {
          where: {
            isPublished: true,
            parentId: null,
          },
          select: {
            id: true,
            pageName: true,
            slug: true,
            pageType: true,
            pageOrder: true,
            pageTitle: true,
            children: {
              where: { isPublished: true },
              select: {
                id: true,
                pageName: true,
                slug: true,
                pageType: true,
                pageOrder: true,
              },
              orderBy: { pageOrder: "asc" },
            },
          },
          orderBy: { pageOrder: "asc" },
        },
      },
    });

    if (!school) {
      throw new ApiError(StatusCodes.NOT_FOUND, "School not found");
    }

    return school;
  }

  // Update school
  static async updateSchool(id: string, data: UpdateSchoolDTO) {
    const existingSchool = await prisma.school.findUnique({ where: { id } });

    if (!existingSchool) {
      throw new ApiError(StatusCodes.NOT_FOUND, "School not found");
    }

    // Check for duplicate name
    if (data.name && data.name !== existingSchool.name) {
      const duplicate = await prisma.school.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "School with this name already exists",
        );
      }
    }

    // Generate new slug if name changed
    let slug = existingSchool.slug;
    if (data.name && data.name !== existingSchool.name) {
      slug = await SlugService.generateSchoolSlug(data.name);
    }

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });

    return updatedSchool;
  }

  // Delete school
  static async deleteSchool(id: string) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });

    if (!school) {
      throw new ApiError(StatusCodes.NOT_FOUND, "School not found");
    }

    // Check if school has pages
    if (school._count.pages > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot delete school. It has ${school._count.pages} associated pages. Remove or reassign pages first.`,
      );
    }

    await prisma.school.delete({ where: { id } });

    return { message: "School deleted successfully" };
  }

  // Get all schools (for dropdowns/simple lists)
  static async getAllSchoolsSimple(isActive?: boolean) {
    const schools = await prisma.school.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return schools;
  }
}
