import "dotenv/config";
import { Worker } from "bullmq";

const connection = {
	host: process.env.REDIS_HOST ?? "localhost",
	port: Number(process.env.REDIS_PORT ?? 6379),
};

const worker = new Worker(
	"task-reminders",
	async (job) => {
		if (job.name !== "task-due") return;

		console.log(
			`Task ${job.data.taskId} reached its due date (${job.data.dueDate})`
		);
	},
	{
		connection,
		concurrency: 5,
	}
);

worker.on("completed", (job) => {
	console.log(`Completed task reminder job ${job.id}`);
});

worker.on("failed", (job, error) => {
	console.error(`Task reminder job ${job?.id ?? "unknown"} failed`, error);
});

async function shutdown() {
	await worker.close();
	process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log("TaskFlow Worker started");