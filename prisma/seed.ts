import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role, Status, Priority } from "../src/generated/prisma/enums";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Password used for both demo users
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@taskflow.com",
      passwordHash,
      name: "TaskFlow Admin",
    },
  });

  const member = await prisma.user.create({
    data: {
      email: "member@taskflow.com",
      passwordHash,
      name: "TaskFlow Member",
    },
  });

  // Organization
  const organization = await prisma.organization.create({
    data: {
      name: "TaskFlow Organization",
    },
  });

  // Organization memberships
  await prisma.orgMember.createMany({
    data: [
      {
        userId: admin.id,
        orgId: organization.id,
        role: Role.org_admin,
      },
      {
        userId: member.id,
        orgId: organization.id,
        role: Role.member,
      },
    ],
  });

  // Projects
  const backendProject = await prisma.project.create({
    data: {
      organization: {
        connect: { id: organization.id },
      },
      name: "Backend Development",
      description: "TaskFlow backend API development",
    },
  });

  const testingProject = await prisma.project.create({
    data: {
      organization: {
        connect: { id: organization.id },
      },
      name: "Testing & QA",
      description: "API testing and quality assurance",
    },
  });

  // Tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: backendProject.id,
      title: "Implement authentication",
      description: "Build JWT-based authentication APIs",
      status: Status.in_progress,
      priority: Priority.high,
      dueDate: new Date("2026-08-25"),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: backendProject.id,
      title: "Implement project APIs",
      description: "Create CRUD endpoints for projects",
      status: Status.todo,
      priority: Priority.high,
      dueDate: new Date("2026-08-27"),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: backendProject.id,
      title: "Add task filtering",
      description: "Support filtering tasks by status and priority",
      status: Status.review,
      priority: Priority.medium,
      dueDate: new Date("2026-08-28"),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: testingProject.id,
      title: "Write integration tests",
      description: "Add integration tests for the API",
      status: Status.todo,
      priority: Priority.medium,
      dueDate: new Date("2026-08-29"),
    },
  });

  // Assign tasks
  await prisma.taskAssignment.createMany({
    data: [
      {
        taskId: task1.id,
        userId: admin.id,
      },
      {
        taskId: task2.id,
        userId: member.id,
      },
      {
        taskId: task3.id,
        userId: member.id,
      },
      {
        taskId: task4.id,
        userId: admin.id,
      },
    ],
  });

  // Comments
  await prisma.comment.createMany({
    data: [
      {
        taskId: task1.id,
        userId: admin.id,
        content: "Authentication implementation is in progress.",
      },
      {
        taskId: task2.id,
        userId: member.id,
        content: "I will start the project endpoints next.",
      },
      {
        taskId: task3.id,
        userId: member.id,
        content: "Filtering by status and priority has been implemented.",
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("Demo users:");
  console.log("Admin:  admin@taskflow.com / Password123!");
  console.log("Member: member@taskflow.com / Password123!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
