import { Router } from "express";
import { projectGroupsController } from "../controllers/projectGroups.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addProjectGroupMemberSchema,
  createProjectGroupSchema,
  updateProjectGroupSchema,
} from "../validators/projectGroup.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", projectGroupsController.getProjectGroups);
router.post(
  "/",
  validate(createProjectGroupSchema),
  projectGroupsController.createProjectGroup,
);
router.get("/:groupId", projectGroupsController.getProjectGroup);
router.put(
  "/:groupId",
  validate(updateProjectGroupSchema),
  projectGroupsController.updateProjectGroup,
);
router.delete("/:groupId", projectGroupsController.deleteProjectGroup);
router.post(
  "/:groupId/members",
  validate(addProjectGroupMemberSchema),
  projectGroupsController.addMember,
);
router.delete(
  "/:groupId/members/:userId",
  projectGroupsController.removeMember,
);

export default router;