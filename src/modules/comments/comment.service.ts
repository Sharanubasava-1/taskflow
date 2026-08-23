import { prisma } from "../../config/database";

async function verifyTaskAccess(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string
) {
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      deletedAt: null,
      project: {
        orgId,
        deletedAt: null,
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }
}

export async function createComment(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  content: string
) {
  await verifyTaskAccess(userId, orgId, projectId, taskId);

  return prisma.comment.create({
    data: {
      taskId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getComments(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string
) {
  await verifyTaskAccess(userId, orgId, projectId, taskId);

  return prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

async function getCommentForTask(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  commentId: string
) {
  await verifyTaskAccess(userId, orgId, projectId, taskId);

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      taskId,
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  return comment;
}

export async function updateComment(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  commentId: string,
  content: string
) {
  await getCommentForTask(
    userId,
    orgId,
    projectId,
    taskId,
    commentId
  );

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
}

export async function deleteComment(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  commentId: string
) {
  await getCommentForTask(
    userId,
    orgId,
    projectId,
    taskId,
    commentId
  );

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { message: "Comment deleted successfully" };
}