import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerDocument = {
  openapi: "3.0.0",

  info: {
    title: "TaskFlow API",
    version: "1.0.0",
    description:
      "REST API for TaskFlow organization, project, task, assignment, and comment management.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],

  tags: [
    {
      name: "Health",
      description: "API health check",
    },
    {
      name: "Authentication",
      description: "User registration, login, refresh token, and logout",
    },
    {
      name: "Organizations",
      description: "Organization management",
    },
    {
      name: "Organization Members",
      description: "Organization membership and role management",
    },
    {
      name: "Projects",
      description: "Project management",
    },
    {
      name: "Tasks",
      description: "Task management",
    },
    {
      name: "Task Assignments",
      description: "Task assignment management",
    },
    {
      name: "Task Comments",
      description: "Task comment management",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          email: {
            type: "string",
            format: "email",
          },
          name: {
            type: "string",
          },
        },
      },

      Organization: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          name: {
            type: "string",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      OrganizationMember: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          userId: {
            type: "string",
            format: "uuid",
          },
          orgId: {
            type: "string",
            format: "uuid",
          },
          role: {
            type: "string",
            enum: ["org_admin", "member"],
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          user: {
            $ref: "#/components/schemas/User",
          },
        },
      },

      Project: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          orgId: {
            type: "string",
            format: "uuid",
          },
          name: {
            type: "string",
          },
          description: {
            type: "string",
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Task: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          projectId: {
            type: "string",
            format: "uuid",
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
            nullable: true,
          },
          status: {
            type: "string",
          },
          priority: {
            type: "string",
          },
          dueDate: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Error: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
        },
      },
    },
  },

  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "ok",
                    },
                    service: {
                      type: "string",
                      example: "taskflow-api",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "Password123",
                  },
                  name: {
                    type: "string",
                    example: "John Doe",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "Password123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },

    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        responses: {
          "200": {
            description: "New access token generated",
          },
          "401": {
            description: "Invalid or revoked refresh token",
          },
        },
      },
    },

    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout user",
        responses: {
          "200": {
            description: "Logout successful",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },
    },

    "/organizations": {
      get: {
        tags: ["Organizations"],
        summary: "List user's organizations",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Organizations returned successfully",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },

      post: {
        tags: ["Organizations"],
        summary: "Create organization",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                    example: "My Organization",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Organization created",
          },
          "400": {
            description: "Validation failed",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },
    },

    "/organizations/{orgId}": {
      get: {
        tags: ["Organizations"],
        summary: "Get an organization",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Organization returned",
          },
          "403": {
            description: "User is not a member of the organization",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },
    },

    "/organizations/{orgId}/members": {
      get: {
        tags: ["Organization Members"],
        summary: "List organization members",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Members returned",
          },
          "403": {
            description: "User is not a member",
          },
        },
      },

      post: {
        tags: ["Organization Members"],
        summary: "Add a member to organization",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: {
                    type: "string",
                    format: "uuid",
                  },
                  role: {
                    type: "string",
                    enum: ["org_admin", "member"],
                    default: "member",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Member added",
          },
          "400": {
            description: "Validation failed",
          },
          "403": {
            description: "Only organization admins can add members",
          },
        },
      },
    },

    "/organizations/{orgId}/members/{userId}": {
      patch: {
        tags: ["Organization Members"],
        summary: "Change member role",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: {
                    type: "string",
                    enum: ["org_admin", "member"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Member role updated",
          },
          "400": {
            description: "Validation failed",
          },
          "403": {
            description: "Only organization admins can change roles",
          },
        },
      },

      delete: {
        tags: ["Organization Members"],
        summary: "Remove member",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Member removed",
          },
          "403": {
            description: "Only organization admins can remove members",
          },
        },
      },
    },

    "/organizations/{orgId}/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects in organization",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Projects returned",
          },
          "403": {
            description: "Access denied",
          },
        },
      },

      post: {
        tags: ["Projects"],
        summary: "Create project",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: {
                    type: "string",
                    example: "Website Project",
                  },
                  description: {
                    type: "string",
                    example: "Build the company website",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Project created",
          },
          "400": {
            description: "Validation failed",
          },
          "403": {
            description: "Access denied",
          },
        },
      },
    },

    "/organizations/{orgId}/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Get project",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Project returned",
          },
          "404": {
            description: "Project not found",
          },
        },
      },

      patch: {
        tags: ["Projects"],
        summary: "Update project",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Project updated",
          },
          "400": {
            description: "Validation failed",
          },
          "404": {
            description: "Project not found",
          },
        },
      },

      delete: {
        tags: ["Projects"],
        summary: "Delete project",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Project deleted",
          },
          "404": {
            description: "Project not found",
          },
        },
      },
    },

    "/organizations/{orgId}/projects/{projectId}/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "priority",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "assigneeId",
            in: "query",
            required: false,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Tasks returned",
          },
          "403": {
            description: "Access denied",
          },
        },
      },

      post: {
        tags: ["Tasks"],
        summary: "Create task",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: {
                    type: "string",
                    example: "Implement authentication",
                  },
                  description: {
                    type: "string",
                    example: "Implement JWT authentication",
                  },
                  status: {
                    type: "string",
                  },
                  priority: {
                    type: "string",
                  },
                  dueDate: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Task created",
          },
          "400": {
            description: "Validation failed",
          },
          "403": {
            description: "Access denied",
          },
        },
      },
    },

    "/organizations/{orgId}/projects/{projectId}/tasks/{taskId}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Task returned",
          },
          "404": {
            description: "Task not found",
          },
        },
      },

      patch: {
        tags: ["Tasks"],
        summary: "Update task",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  status: {
                    type: "string",
                  },
                  priority: {
                    type: "string",
                  },
                  dueDate: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Task updated",
          },
          "400": {
            description: "Validation failed",
          },
          "404": {
            description: "Task not found",
          },
        },
      },

      delete: {
        tags: ["Tasks"],
        summary: "Delete task",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Task deleted",
          },
          "404": {
            description: "Task not found",
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );
}