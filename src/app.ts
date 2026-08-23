import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

import authRoutes from "./modules/auth/auth.routes";
import organizationRoutes from "./modules/organizations/organization.routes";
import projectRoutes from "./modules/projects/project.routes";
import taskRoutes from "./modules/tasks/task.routes";
import commentRoutes from "./modules/comments/comment.routes";
import assignmentRoutes from "./modules/assignments/assignment.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use("/auth", authRoutes);
app.use("/organizations", organizationRoutes);
app.use("/organizations", projectRoutes);
app.use("/organizations", taskRoutes);
app.use("/organizations", commentRoutes);
app.use("/organizations", assignmentRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "taskflow-api",
  });
});

export default app;