import { Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";

import {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
} from "./task.service";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z
    .enum(["todo", "in_progress", "review", "done"])
    .optional(),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z
    .enum(["todo", "in_progress", "review", "done"])
    .optional(),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const listTaskQuerySchema = z.object({
  status: z
    .enum(["todo", "in_progress", "review", "done"])
    .optional(),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional(),
  assignedTo: z.string().uuid().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
});

export async function create(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const input = createTaskSchema.parse(req.body);

    const task = await createTask(
      req.user.userId,
      req.params.orgId as string,
      req.params.projectId as string,
      input
    );

    return res.status(201).json(task);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function list(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const filters = listTaskQuerySchema.parse(req.query);

    const tasks = await getProjectTasks(
      req.user.userId,
      req.params.orgId as string,
      req.params.projectId as string,
      filters
    );

    return res.status(200).json(tasks);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getOne(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const task = await getTask(
      req.user.userId,
      req.params.orgId as string,
      req.params.projectId as string,
      req.params.taskId as string
    );

    return res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const input = updateTaskSchema.parse(req.body);

    const task = await updateTask(
      req.user.userId,
      req.params.orgId as string,
      req.params.projectId as string,
      req.params.taskId as string,
      input
    );

    return res.status(200).json(task);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = await deleteTask(
      req.user.userId,
      req.params.orgId as string,
      req.params.projectId as string,
      req.params.taskId as string
    );

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}