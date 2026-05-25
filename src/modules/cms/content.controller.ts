import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ContentService } from "./content.service";
import {
  CreateContentBlockSchema,
  UpdateContentBlockSchema,
} from "./content.dto";
import { ApiResponse } from "../../utils/apiResponse";

export class ContentController {
  // Create content block
  static async createContentBlock(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = CreateContentBlockSchema.parse(req.body);
      const contentBlock = await ContentService.createContentBlock(data);

      ApiResponse.created(res, {
        message: "Content block created successfully",
        data: contentBlock,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get page content by page ID
  static async getPageContent(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.getPageContent(req.params.pageId);

      ApiResponse.success(res, {
        message: "Page content fetched successfully",
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get page content by slug (public)
  static async getPageContentBySlug(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const content = await ContentService.getPageContentBySlug(
        req.params.slug,
      );

      ApiResponse.success(res, {
        message: "Page content fetched successfully",
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update content block
  static async updateContentBlock(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = UpdateContentBlockSchema.parse(req.body);
      const contentBlock = await ContentService.updateContentBlock(
        req.params.id,
        data,
      );

      ApiResponse.success(res, {
        message: "Content block updated successfully",
        data: contentBlock,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete content block
  static async deleteContentBlock(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await ContentService.deleteContentBlock(req.params.id);

      ApiResponse.success(res, {
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Reorder content blocks
  static async reorderContentBlocks(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { blocks } = req.body;
      const result = await ContentService.reorderContentBlocks(blocks);

      ApiResponse.success(res, {
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
