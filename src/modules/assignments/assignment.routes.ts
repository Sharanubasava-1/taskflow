import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { list, create, remove } from "./assignment.controller";

const router = Router();

router.use(authenticate);

router.get("/:orgId/projects/:projectId/tasks/:taskId/assignments", list);
router.post("/:orgId/projects/:projectId/tasks/:taskId/assignments", create);
router.delete("/:orgId/projects/:projectId/tasks/:taskId/assignments/:userId", remove);

export default router;