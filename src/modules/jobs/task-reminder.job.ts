import { Queue } from "bullmq";

let taskReminderQueue: Queue | null = null;

function getTaskReminderQueue(): Queue {
  if (!taskReminderQueue) {
    const connection = {
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? 6379),
    };

    taskReminderQueue = new Queue("task-reminders", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }

  return taskReminderQueue;
}

export async function scheduleTaskReminder(
  taskId: string,
  dueDate: Date | null
) {
  if (!dueDate) return;

  try {
    const queue = getTaskReminderQueue();

    await queue.add(
      "task-due",
      {
        taskId,
        dueDate: dueDate.toISOString(),
      },
      {
        jobId: `task-due-${taskId}`,
        delay: Math.max(0, dueDate.getTime() - Date.now()),
      }
    );
  } catch (error) {
    console.error("Failed to schedule task reminder:", error);
  }
}
