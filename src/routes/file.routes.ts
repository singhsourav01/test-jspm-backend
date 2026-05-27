import { Router } from "express";
import { FileController } from "../modules/file/file.controller";
import { uploadFile } from "../modules/file/file.service";

const router = Router();

router.post("/file", uploadFile, FileController.create);
router.get("/files", FileController.getAll);
router.get("/file/:id", FileController.getById);
router.patch("/file/:id", FileController.update);
router.delete("/file/:id", FileController.delete);

export default router;
