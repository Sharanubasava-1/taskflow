import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  create,
  list,
  getOne,
  update,
  remove,
} from "./task.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/:orgId/projects/:projectId/tasks",
  create
);

router.get(
  "/:orgId/projects/:projectId/tasks",
  list
);

router.get(
  "/:orgId/projects/:projectId/tasks/:taskId",
  getOne
);

router.patch(
  "/:orgId/projects/:projectId/tasks/:taskId",
  update
);

router.delete(
  "/:orgId/projects/:projectId/tasks/:taskId",
  remove
);

export default router;