import { Router } from "express";
import { projectsController } from "../controllers/projects.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", projectsController.getProjects);
router.post(
  "/",
  validate(createProjectSchema),
  projectsController.createProject,
);
router.get("/:projectId", projectsController.getProject);
router.put(
  "/:projectId",
  validate(updateProjectSchema),
  projectsController.updateProject,
);
router.delete("/:projectId", projectsController.deleteProject);

export default router;