import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const taskReminderQueue = new Queue("task-reminders", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export async function scheduleTaskReminder(
  taskId: string,
  dueDate: Date | null
) {
  if (!dueDate) return;

  await taskReminderQueue.add(
    "task-due",
    { taskId, dueDate: dueDate.toISOString() },
    {
      jobId: `task-due-${taskId}`,
      delay: Math.max(0, dueDate.getTime() - Date.now()),
    }
  );
}