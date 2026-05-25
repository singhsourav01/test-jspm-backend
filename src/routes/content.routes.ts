import { Router } from "express";
import { ContentController } from "../modules/cms/content.controller";

const router = Router();

// Public route - Get page content by slug
router.get("/content/slug/:slug", ContentController.getPageContentBySlug);

// Protected routes

router.post("/content", ContentController.createContentBlock);
router.get("/content/page/:pageId", ContentController.getPageContent);
router.patch("/content/:id", ContentController.updateContentBlock);
router.delete("/content/:id", ContentController.deleteContentBlock);
router.put("/content/reorder", ContentController.reorderContentBlocks);

export default router;
