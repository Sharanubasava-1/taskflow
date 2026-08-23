import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  create,
  list,
  getOne,
  addOrganizationMember,
  listMembers,
  changeMemberRole,
  deleteMember,
} from "./organization.controller";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/", list);
router.get("/:orgId", getOne);

router.post("/:orgId/members", addOrganizationMember);
router.get("/:orgId/members", listMembers);
router.patch("/:orgId/members/:userId", changeMemberRole);
router.delete("/:orgId/members/:userId", deleteMember);

export default router;