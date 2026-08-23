import { Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";

import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "./project.service";

const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
});

const updateProjectSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined,
    {
      message: "At least one field is required",
    }
  );

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

    const organizationId = req.params.orgId as string;

    const input = createProjectSchema.parse(req.body);

    const project = await createProject(
      req.user.userId,
      organizationId,
      input
    );

    return res.status(201).json(project);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      if (
        error.message.includes("not a member") ||
        error.message.includes("Only organization admins")
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

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

    const organizationId = req.params.orgId as string;

    const projects = await getProjects(
      req.user.userId,
      organizationId
    );

    return res.status(200).json(projects);
  } catch (error: any) {
    if (error instanceof Error) {
      return res.status(403).json({
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

    const organizationId = req.params.orgId as string;
    const projectId = req.params.projectId as string;

    const project = await getProject(
      req.user.userId,
      organizationId,
      projectId
    );

    return res.status(200).json(project);
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("not a member")) {
        return res.status(403).json({
          message: error.message,
        });
      }

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

    const organizationId = req.params.orgId as string;
    const projectId = req.params.projectId as string;

    const input = updateProjectSchema.parse(req.body);

    const project = await updateProject(
      req.user.userId,
      organizationId,
      projectId,
      input
    );

    return res.status(200).json(project);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      if (
        error.message.includes("not a member") ||
        error.message.includes("Only organization admins")
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

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

    const organizationId = req.params.orgId as string;
    const projectId = req.params.projectId as string;

    const result = await deleteProject(
      req.user.userId,
      organizationId,
      projectId
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof Error) {
      if (
        error.message.includes("not a member") ||
        error.message.includes("Only organization admins")
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}