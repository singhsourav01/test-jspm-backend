import { Router } from "express";
import { SchoolController } from "../modules/schools/school.controller";

const router = Router();

// Public routes (if needed for frontend)
router.get("/schools/simple", SchoolController.getAllSchoolsSimple);
router.get("/schools/slug/:slug", SchoolController.getSchoolBySlug);

// CRUD Operations
router.post("/school", SchoolController.createSchool);
router.get("/schools", SchoolController.getSchools);
router.get("/school/:id", SchoolController.getSchoolById);
router.patch("/school/:id", SchoolController.updateSchool);
router.delete("/school/:id", SchoolController.deleteSchool);

export default router;
