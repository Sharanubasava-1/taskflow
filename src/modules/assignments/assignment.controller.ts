import { Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  getAssignments,
  assignTask,
  unassignTask,
} from "./assignment.service";

const assignmentSchema = z.object({
  userId: z.string().uuid(),
});

function params(req: AuthenticatedRequest) {
  return {
    userId: req.user!.userId,
    orgId: req.params.orgId as string,
    projectId: req.params.projectId as string,
    taskId: req.params.taskId as string,
  };
}

function handleError(res: Response, error: unknown) {
  if ((error as { name?: string })?.name === "ZodError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: (error as { issues: unknown }).issues,
    });
  }

  if (error instanceof Error) return res.status(404).json({ message: error.message });
  return res.status(500).json({ message: "Internal server error" });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const route = params(req);
    return res.status(200).json(await getAssignments(route.userId, route.orgId, route.projectId, route.taskId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const { userId: assigneeId } = assignmentSchema.parse(req.body);
    const route = params(req);
    return res.status(201).json(await assignTask(route.userId, route.orgId, route.projectId, route.taskId, assigneeId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const route = params(req);
    return res.status(200).json(await unassignTask(route.userId, route.orgId, route.projectId, route.taskId, req.params.userId as string));
  } catch (error) {
    return handleError(res, error);
  }
}