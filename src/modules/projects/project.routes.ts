import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  create,
  list,
  getOne,
  update,
  remove,
} from "./project.controller";

const router = Router();

router.use(authenticate);

router.post("/:orgId/projects", create);
router.get("/:orgId/projects", list);
router.get("/:orgId/projects/:projectId", getOne);
router.patch("/:orgId/projects/:projectId", update);
router.delete("/:orgId/projects/:projectId", remove);

export default router;