import { Router } from "express";
import { CmsController } from "../modules/cms/cms.controller";

const router = Router();

// Public routes for navigation
router.get("/nav/main", CmsController.getMainNavigation);
router.get("/nav/school/:schoolId", CmsController.getSchoolHierarchy);
router.get("/nav/:category", CmsController.getPageHierarchyByCategory);

// Normal pages routes
router.get("/pages/normal", CmsController.getNormalPages);

// CRUD Operations (Protected)
router.post("/page", CmsController.createPage);
router.get("/pages", CmsController.getPages);
router.get("/page/:id", CmsController.getPageById);
router.patch("/page/:id", CmsController.updatePage);
router.delete("/page/:id", CmsController.deletePage);

// Utility Operations
router.put("/pages/reorder", CmsController.reorderPages);
router.patch("/pages/bulk/status", CmsController.bulkUpdateStatus);

export default router;
