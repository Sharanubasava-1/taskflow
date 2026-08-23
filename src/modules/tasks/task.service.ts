import { prisma } from "../../config/database";

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: "todo" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
}

export interface TaskFilterInput {
  status?: "todo" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export function buildTaskFilters(input: TaskFilterInput) {
  const filters: Record<string, unknown>[] = [];

  if (input.status) {
    filters.push({ status: input.status });
  }

  if (input.priority) {
    filters.push({ priority: input.priority });
  }

  if (input.assignedTo) {
    filters.push({
      assignments: {
        some: {
          userId: input.assignedTo,
        },
      },
    });
  }

  if (input.dueDateFrom) {
    filters.push({
      dueDate: {
        gte: new Date(input.dueDateFrom),
      },
    });
  }

  if (input.dueDateTo) {
    filters.push({
      dueDate: {
        lte: new Date(input.dueDateTo),
      },
    });
  }

  return filters.length > 0 ? { AND: filters } : {};
}

async function verifyProjectAccess(
  userId: string,
  orgId: string,
  projectId: string
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

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      orgId,
      deletedAt: null,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

export async function createTask(
  userId: string,
  orgId: string,
  projectId: string,
  input: CreateTaskInput
) {
  await verifyProjectAccess(userId, orgId, projectId);

  const task = await prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate
        ? new Date(input.dueDate)
        : undefined,
    },
  });

  const { scheduleTaskReminder } = await import("../jobs/task-reminder.job");

  await scheduleTaskReminder(task.id, task.dueDate);
  
  
  return task;
}

export async function getProjectTasks(
  userId: string,
  orgId: string,
  projectId: string,
  filters: TaskFilterInput = {}
) {
  await verifyProjectAccess(userId, orgId, projectId);

  return prisma.task.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...buildTaskFilters(filters),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getTask(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string
) {
  await verifyProjectAccess(userId, orgId, projectId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      deletedAt: null,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}

export async function updateTask(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  await verifyProjectAccess(userId, orgId, projectId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      deletedAt: null,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      ...input,
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate === null
            ? null
            : new Date(input.dueDate),
    },
  });
}

export async function deleteTask(
  userId: string,
  orgId: string,
  projectId: string,
  taskId: string
) {
  await verifyProjectAccess(userId, orgId, projectId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      deletedAt: null,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    message: "Task deleted successfully",
  };
}