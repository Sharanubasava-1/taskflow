import { Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";

import {
  createOrganization,
  getOrganization,
  getUserOrganizations,
  addMember,
  getMembers,
  updateMemberRole,
  removeMember,
} from "./organization.service";

const memberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["org_admin", "member"]).default("member"),
});

const roleSchema = z.object({
  role: z.enum(["org_admin", "member"]),
});

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
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

    const input = createOrganizationSchema.parse(req.body);

    const organization = await createOrganization(
      req.user.userId,
      input.name
    );

    return res.status(201).json(organization);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
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

    const organizations = await getUserOrganizations(
      req.user.userId
    );

    return res.status(200).json(organizations);
  } catch {
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

    const organization = await getOrganization(
      req.user.userId,
      organizationId
    );

    return res.status(200).json(organization);
  } catch (error: any) {
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

export async function addOrganizationMember(
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

    const input = memberSchema.parse(req.body);

    const member = await addMember(
      req.user.userId,
      organizationId,
      input.userId,
      input.role
    );

    return res.status(201).json(member);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

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

export async function listMembers(
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

    const members = await getMembers(
      req.user.userId,
      organizationId
    );

    return res.status(200).json(members);
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

export async function changeMemberRole(
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
    const userId = req.params.userId as string;

    const input = roleSchema.parse(req.body);

    const member = await updateMemberRole(
      req.user.userId,
      organizationId,
      userId,
      input.role
    );

    return res.status(200).json(member);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

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

export async function deleteMember(
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
    const userId = req.params.userId as string;

    const result = await removeMember(
      req.user.userId,
      organizationId,
      userId
    );

    return res.status(200).json(result);
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