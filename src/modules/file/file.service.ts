import { ApiError } from "common-microservices-utils";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import prisma from "../../config/prisma.config";
import { CreateFileDTO, UpdateFileDTO, FileQueryDTO } from "./file.dto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const rawUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single("file");

function wrapMulter(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err?: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, err.message),
          );
        }
        return next(err);
      }
      next();
    });
  };
}

export const uploadFile = wrapMulter(rawUpload);

export class FileService {
  static async create(data: CreateFileDTO, file: Express.Multer.File) {
    const record = await prisma.file.create({
      data: {
        fileUploadType: data.fileUploadType,
        fileMediaType: file.mimetype,
        fileUrl: `/uploads/${file.filename}`,
        fileThumbnail: file.mimetype.startsWith("image/")
          ? `/uploads/${file.filename}`
          : null,
      },
    });
    return record;
  }

  static async getAll(query: FileQueryDTO) {
    const where: Record<string, unknown> = { fileIsDelete: false };
    if (query.fileUploadType) where.fileUploadType = query.fileUploadType;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.file.count({ where }),
    ]);

    return {
      data: files,
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

  static async getById(id: string) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.fileIsDelete) {
      throw new ApiError(StatusCodes.NOT_FOUND, "File not found");
    }
    return file;
  }

  static async update(id: string, data: UpdateFileDTO) {
    await this.getById(id);
    return prisma.file.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    await this.getById(id);
    return prisma.file.update({
      where: { id },
      data: { fileIsDelete: true },
    });
  }
}
