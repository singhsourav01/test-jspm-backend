import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../utils/apiResponse";
import { FileService } from "./file.service";
import {
  CreateFileSchema,
  UpdateFileSchema,
  FileQuerySchema,
} from "./file.dto";
import { StatusCodes } from "http-status-codes";

export class FileController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateFileSchema.parse(req.body);
      if (!req.file) {
        return ApiResponse.error(res, {
          message: "No file provided",
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      const file = await FileService.create(data, req.file);
      ApiResponse.created(res, {
        message: "File uploaded successfully",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = FileQuerySchema.parse(req.query);
      const result = await FileService.getAll(query);
      ApiResponse.success(res, {
        message: "Files fetched successfully",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const file = await FileService.getById(req.params.id);
      ApiResponse.success(res, {
        message: "File fetched successfully",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateFileSchema.parse(req.body);
      const file = await FileService.update(req.params.id, data);
      ApiResponse.success(res, {
        message: "File updated successfully",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await FileService.softDelete(req.params.id);
      ApiResponse.success(res, {
        message: "File deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
