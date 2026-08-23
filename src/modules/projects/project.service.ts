import { prisma } from "../../config/database";

type ProjectInput = {
  name?: string;
  description?: string;
};

async function getOrganizationMembership(
  userId: string,
  organizationId: string
) {
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  return membership;
}

export async function createProject(
  userId: string,
  organizationId: string,
  input: {
    name: string;
    description?: string;
  }
) {
  const membership = await getOrganizationMembership(
    userId,
    organizationId
  );

  if (membership.role !== "org_admin") {
    throw new Error("Only organization admins can create projects");
  }

  return prisma.project.create({
    data: {
      orgId: organizationId,
      name: input.name,
      description: input.description,
    },
  });
}

export async function getProjects(
  userId: string,
  organizationId: string
) {
  await getOrganizationMembership(userId, organizationId);

  return prisma.project.findMany({
    where: {
      orgId: organizationId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProject(
  userId: string,
  organizationId: string,
  projectId: string
) {
  await getOrganizationMembership(userId, organizationId);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      orgId: organizationId,
      deletedAt: null,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

export async function updateProject(
  userId: string,
  organizationId: string,
  projectId: string,
  input: {
    name?: string;
    description?: string;
  }
) {
  const membership = await getOrganizationMembership(
    userId,
    organizationId
  );

  if (membership.role !== "org_admin") {
    throw new Error("Only organization admins can update projects");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      orgId: organizationId,
      deletedAt: null,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
    },
  });
}

export async function deleteProject(
  userId: string,
  organizationId: string,
  projectId: string
) {
  const membership = await getOrganizationMembership(
    userId,
    organizationId
  );

  if (membership.role !== "org_admin") {
    throw new Error("Only organization admins can delete projects");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      orgId: organizationId,
      deletedAt: null,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    message: "Project deleted successfully",
  };
}