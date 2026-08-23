import { Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from "./comment.service";

const contentSchema = z.object({
  content: z.string().min(1).max(5000),
});

function getParams(req: AuthenticatedRequest) {
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

  if (error instanceof Error) {
    return res.status(404).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const { content } = contentSchema.parse(req.body);
    const params = getParams(req);
    return res.status(201).json(await createComment(params.userId, params.orgId, params.projectId, params.taskId, content));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const params = getParams(req);
    return res.status(200).json(await getComments(params.userId, params.orgId, params.projectId, params.taskId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const { content } = contentSchema.parse(req.body);
    const params = getParams(req);
    return res.status(200).json(await updateComment(params.userId, params.orgId, params.projectId, params.taskId, req.params.commentId as string, content));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const params = getParams(req);
    return res.status(200).json(await deleteComment(params.userId, params.orgId, params.projectId, params.taskId, req.params.commentId as string));
  } catch (error) {
    return handleError(res, error);
  }
}