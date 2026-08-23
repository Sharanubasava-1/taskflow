const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    status: response.status,
    body,
  };
}

async function createTestUser() {
  const email = `task-test-${Date.now()}-${Math.random()}@example.com`;

  const register = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123",
      name: "Task Integration User",
    }),
  });

  assert.equal(register.status, 201);

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123",
    }),
  });

  assert.equal(login.status, 200);

  return {
    token: login.body.accessToken,
    user: login.body.user,
    organization: register.body.organization,
  };
}

async function createTestProject(token, orgId) {
  const result = await request(
    `/organizations/${orgId}/projects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Task Test Project ${Date.now()}`,
        description: "Project for task integration tests",
      }),
    }
  );

  assert.equal(result.status, 201);

  return result.body;
}

test("authenticated user can create and get a task", async () => {
  const { token, organization } = await createTestUser();

  const project = await createTestProject(
    token,
    organization.id
  );

  const createTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Integration Test Task",
        description: "Testing task creation",
        status: "todo",
        priority: "high",
        dueDate: "2026-08-31T12:00:00.000Z",
      }),
    }
  );

  assert.equal(createTask.status, 201);
  assert.ok(createTask.body.id);
  assert.equal(createTask.body.projectId, project.id);
  assert.equal(createTask.body.title, "Integration Test Task");
  assert.equal(createTask.body.status, "todo");
  assert.equal(createTask.body.priority, "high");

  const task = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(task.status, 200);
  assert.equal(task.body.id, createTask.body.id);
  assert.equal(task.body.title, "Integration Test Task");
});

test("authenticated user can list tasks and filter by status and priority", async () => {
  const { token, organization } = await createTestUser();

  const project = await createTestProject(
    token,
    organization.id
  );

  const createTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Filtered Task",
        description: "Testing filters",
        status: "todo",
        priority: "high",
        dueDate: "2026-08-31T12:00:00.000Z",
      }),
    }
  );

  assert.equal(createTask.status, 201);

  const statusResult = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks?status=todo`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(statusResult.status, 200);
  assert.ok(Array.isArray(statusResult.body));

  const foundByStatus = statusResult.body.find(
    (task) => task.id === createTask.body.id
  );

  assert.ok(foundByStatus);

  const priorityResult = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks?priority=high`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(priorityResult.status, 200);
  assert.ok(Array.isArray(priorityResult.body));

  const foundByPriority = priorityResult.body.find(
    (task) => task.id === createTask.body.id
  );

  assert.ok(foundByPriority);
});

test("authenticated user can update a task", async () => {
  const { token, organization } = await createTestUser();

  const project = await createTestProject(
    token,
    organization.id
  );

  const createTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Task Before Update",
        description: "Original description",
        status: "todo",
        priority: "medium",
      }),
    }
  );

  assert.equal(createTask.status, 201);

  const updateTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Task After Update",
        description: "Updated description",
        status: "in_progress",
        priority: "urgent",
      }),
    }
  );

  assert.equal(updateTask.status, 200);
  assert.equal(updateTask.body.id, createTask.body.id);
  assert.equal(updateTask.body.title, "Task After Update");
  assert.equal(updateTask.body.description, "Updated description");
  assert.equal(updateTask.body.status, "in_progress");
  assert.equal(updateTask.body.priority, "urgent");
});

test("authenticated user can assign a task and list assignments", async () => {
  const { token, user, organization } = await createTestUser();

  const project = await createTestProject(
    token,
    organization.id
  );

  const createTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Assignment Test Task",
        description: "Testing assignments",
        status: "todo",
        priority: "high",
      }),
    }
  );

  assert.equal(createTask.status, 201);

  const assignment = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}/assignments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    }
  );

  assert.equal(assignment.status, 201);
  assert.equal(assignment.body.taskId, createTask.body.id);
  assert.equal(assignment.body.userId, user.id);

  const assignments = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}/assignments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(assignments.status, 200);
  assert.ok(Array.isArray(assignments.body));

  const found = assignments.body.find(
    (item) => item.userId === user.id
  );

  assert.ok(found);
});

test("authenticated user can create, update, and delete a task comment", async () => {
  const { token, organization } = await createTestUser();

  const project = await createTestProject(
    token,
    organization.id
  );

  const createTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Comment Test Task",
        description: "Testing comments",
        status: "todo",
        priority: "medium",
      }),
    }
  );

  assert.equal(createTask.status, 201);

  const createComment = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: "Initial task comment",
      }),
    }
  );

  assert.equal(createComment.status, 201);
  assert.ok(createComment.body.id);
  assert.equal(createComment.body.content, "Initial task comment");

  const commentId = createComment.body.id;

  const updateComment = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}/comments/${commentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: "Updated task comment",
      }),
    }
  );

  assert.equal(updateComment.status, 200);
  assert.equal(updateComment.body.content, "Updated task comment");

  const deleteComment = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${createTask.body.id}/comments/${commentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(deleteComment.status, 200);
});

test("authenticated user can delete a task", async () => {
  const { token, organization } = await createTestUser();

  const project = await createTestProject(
    token,
    organization.id
  );

  const createTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Delete Test Task",
        description: "Testing task deletion",
        status: "todo",
        priority: "low",
      }),
    }
  );

  assert.equal(createTask.status, 201);

  const taskId = createTask.body.id;

  const deleteTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${taskId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(deleteTask.status, 200);

  const getDeletedTask = await request(
    `/organizations/${organization.id}/projects/${project.id}/tasks/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.notEqual(getDeletedTask.status, 200);
});