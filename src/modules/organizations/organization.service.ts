import { prisma } from "../../config/database";

export async function createOrganization(
  userId: string,
  name: string
) {
  return prisma.organization.create({
    data: {
      name,
      members: {
        create: {
          userId,
          role: "org_admin",
        },
      },
    },
    include: {
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });
}

export async function getUserOrganizations(
  userId: string
) {
  return prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getOrganization(
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
    throw new Error(
      "You are not a member of this organization"
    );
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    include: {
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  return organization;
}

export async function addMember(
  currentUserId: string,
  organizationId: string,
  userId: string,
  role: "org_admin" | "member"
) {
  // Check that the requesting user belongs to the organization
  const currentMember = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: currentUserId,
        orgId: organizationId,
      },
    },
  });

  if (!currentMember) {
    throw new Error(
      "You are not a member of this organization"
    );
  }

  // Only org_admin can add members
  if (currentMember.role !== "org_admin") {
    throw new Error(
      "Only organization admins can add members"
    );
  }

  // Check target user exists
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check whether already a member
  const existingMember = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: organizationId,
      },
    },
  });

  if (existingMember) {
    throw new Error(
      "User is already a member of this organization"
    );
  }

  return prisma.orgMember.create({
    data: {
      userId,
      orgId: organizationId,
      role,
    },
    select: {
      id: true,
      userId: true,
      orgId: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export async function getMembers(
  currentUserId: string,
  organizationId: string
) {
  // User must belong to the organization
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: currentUserId,
        orgId: organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error(
      "You are not a member of this organization"
    );
  }

  return prisma.orgMember.findMany({
    where: {
      orgId: organizationId,
    },
    select: {
      id: true,
      userId: true,
      orgId: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function updateMemberRole(
  currentUserId: string,
  organizationId: string,
  userId: string,
  role: "org_admin" | "member"
) {
  // Check requesting user's membership
  const currentMember = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: currentUserId,
        orgId: organizationId,
      },
    },
  });

  if (!currentMember) {
    throw new Error(
      "You are not a member of this organization"
    );
  }

  // Only org_admin can change roles
  if (currentMember.role !== "org_admin") {
    throw new Error(
      "Only organization admins can change member roles"
    );
  }

  const member = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: organizationId,
      },
    },
  });

  if (!member) {
    throw new Error("Organization member not found");
  }

  return prisma.orgMember.update({
    where: {
      id: member.id,
    },
    data: {
      role,
    },
    select: {
      id: true,
      userId: true,
      orgId: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export async function removeMember(
  currentUserId: string,
  organizationId: string,
  userId: string
) {
  // Check requesting user's membership
  const currentMember = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: currentUserId,
        orgId: organizationId,
      },
    },
  });

  if (!currentMember) {
    throw new Error(
      "You are not a member of this organization"
    );
  }

  // Only org_admin can remove members
  if (currentMember.role !== "org_admin") {
    throw new Error(
      "Only organization admins can remove members"
    );
  }

  const member = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId: organizationId,
      },
    },
  });

  if (!member) {
    throw new Error("Organization member not found");
  }

  await prisma.orgMember.delete({
    where: {
      id: member.id,
    },
  });

  return {
    message: "Member removed successfully",
  };
}