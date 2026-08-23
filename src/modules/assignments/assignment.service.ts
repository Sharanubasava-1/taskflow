import { prisma } from "../../config/database";

async function verifyTaskAccess(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string
) {
  const membership = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      deletedAt: null,
      project: { orgId, deletedAt: null },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }
}

export async function getAssignments(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string
) {
  await verifyTaskAccess(userId, orgId, projectId, taskId);

  return prisma.taskAssignment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function assignTask(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  assigneeId: string
) {
  await verifyTaskAccess(userId, orgId, projectId, taskId);

  const assignee = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: assigneeId, orgId } },
  });

  if (!assignee) {
    throw new Error("Assignee is not a member of this organization");
  }

  const existingAssignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId: assigneeId } },
  });

  if (existingAssignment) {
    throw new Error("User is already assigned to this task");
  }

  return prisma.taskAssignment.create({
    data: { taskId, userId: assigneeId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function unassignTask(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  assigneeId: string
) {
  await verifyTaskAccess(userId, orgId, projectId, taskId);

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId: assigneeId } },
  });

  if (!assignment) {
    throw new Error("Task assignment not found");
  }

  await prisma.taskAssignment.delete({ where: { id: assignment.id } });

  return { message: "Task assignment removed successfully" };
}