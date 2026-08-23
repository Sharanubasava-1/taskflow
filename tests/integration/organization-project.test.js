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
  const email = `org-test-${Date.now()}-${Math.random()}@example.com`;

  const register = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123",
      name: "Organization Test User",
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

test("authenticated user can list organizations", async () => {
  const { token, organization } = await createTestUser();

  const result = await request("/organizations", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 200);
  assert.ok(Array.isArray(result.body));

  const found = result.body.find(
    (org) => org.id === organization.id
  );

  assert.ok(found);
  assert.equal(found.name, organization.name);
});

test("authenticated user can get an organization", async () => {
  const { token, organization } = await createTestUser();

  const result = await request(
    `/organizations/${organization.id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.id, organization.id);
});

test("authenticated user can list organization members", async () => {
  const { token, organization } = await createTestUser();

  const result = await request(
    `/organizations/${organization.id}/members`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(result.status, 200);
  assert.ok(Array.isArray(result.body));
  assert.equal(result.body.length, 1);
  assert.equal(result.body[0].role, "org_admin");
});

test("organization admin can create a project", async () => {
  const { token, organization } = await createTestUser();

  const result = await request(
    `/organizations/${organization.id}/projects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Integration Test Project",
        description: "Project created by integration test",
      }),
    }
  );

  assert.equal(result.status, 201);
  assert.ok(result.body.id);
  assert.equal(result.body.orgId, organization.id);
  assert.equal(result.body.name, "Integration Test Project");
  assert.equal(
    result.body.description,
    "Project created by integration test"
  );
});

test("authenticated user can list projects in an organization", async () => {
  const { token, organization } = await createTestUser();

  const createProject = await request(
    `/organizations/${organization.id}/projects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Project List Test",
        description: "Testing project listing",
      }),
    }
  );

  assert.equal(createProject.status, 201);

  const result = await request(
    `/organizations/${organization.id}/projects`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(result.status, 200);
  assert.ok(Array.isArray(result.body));

  const found = result.body.find(
    (project) => project.id === createProject.body.id
  );

  assert.ok(found);
  assert.equal(found.name, "Project List Test");
});
