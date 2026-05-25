import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { CmsService } from "./cms.service";
import {
  CreatePageSchema,
  UpdatePageSchema,
  PageQuerySchema,
  ReorderPagesSchema,
} from "./cms.dto";
import { ApiResponse } from "../../utils/apiResponse";
import { PageCategory } from "@prisma/client";

export class CmsController {
  static async createPage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreatePageSchema.parse(req.body);
      const page = await CmsService.createPage(data);

      ApiResponse.created(res, {
        message: "Page created successfully",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPages(req: Request, res: Response, next: NextFunction) {
    try {
      const query = PageQuerySchema.parse(req.query);
      const result = await CmsService.getPages(query);

      ApiResponse.success(res, {
        message: "Pages fetched successfully",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPageById(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await CmsService.getPageById(req.params.id);

      ApiResponse.success(res, {
        message: "Page fetched successfully",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  }

  // API 1: Get main navigation (fixed pages)
  static async getMainNavigation(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const navPages = await CmsService.getMainNavigation();

      ApiResponse.success(res, {
        message: "Main navigation fetched successfully",
        data: navPages,
      });
    } catch (error) {
      next(error);
    }
  }

  // API 2: Get normal pages
  static async getNormalPages(req: Request, res: Response, next: NextFunction) {
    try {
      const query = PageQuerySchema.parse(req.query);
      const result = await CmsService.getNormalPages(query);

      ApiResponse.success(res, {
        message: "Normal pages fetched successfully",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get hierarchy by category (Home, About Us, etc.)
  static async getPageHierarchyByCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { category } = req.params;
      const validCategory = category.toUpperCase() as PageCategory;

      if (
        !["HOME", "SCHOOL"].includes(
          validCategory,
        )
      ) {
        return ApiResponse.error(res, {
          message: "Invalid category",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const hierarchy =
        await CmsService.getPageHierarchyByCategory(validCategory);

      ApiResponse.success(res, {
        message: `Hierarchy for ${category} fetched successfully`,
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get school hierarchy
  static async getSchoolHierarchy(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const hierarchy = await CmsService.getSchoolHierarchy(
        req.params.schoolId,
      );

      ApiResponse.success(res, {
        message: "School hierarchy fetched successfully",
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdatePageSchema.parse(req.body);
      const page = await CmsService.updatePage(req.params.id, data);

      ApiResponse.success(res, {
        message: "Page updated successfully",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CmsService.deletePage(req.params.id);

      ApiResponse.success(res, {
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderPages(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ReorderPagesSchema.parse(req.body);
      const result = await CmsService.reorderPages(data);

      ApiResponse.success(res, {
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { ids, isPublished } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return ApiResponse.error(res, {
          message: "Please provide an array of page IDs",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const result = await CmsService.bulkUpdateStatus(ids, isPublished);

      ApiResponse.success(res, {
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
