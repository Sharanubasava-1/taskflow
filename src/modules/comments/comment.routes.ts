import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { create, list, update, remove } from "./comment.controller";

const router = Router();

router.use(authenticate);

router.post("/:orgId/projects/:projectId/tasks/:taskId/comments", create);
router.get("/:orgId/projects/:projectId/tasks/:taskId/comments", list);
router.patch("/:orgId/projects/:projectId/tasks/:taskId/comments/:commentId", update);
router.delete("/:orgId/projects/:projectId/tasks/:taskId/comments/:commentId", remove);

export default router;