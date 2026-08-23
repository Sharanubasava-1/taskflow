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

test("health endpoint returns API status", async () => {
  const result = await request("/health");

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    status: "ok",
    service: "taskflow-api",
  });
});

test("protected organization endpoint rejects missing token", async () => {
  const result = await request("/organizations");

  assert.equal(result.status, 401);
  assert.equal(result.body.message, "Authentication token required");
});

test("protected organization endpoint rejects invalid token", async () => {
  const result = await request("/organizations", {
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });

  assert.equal(result.status, 401);
  assert.equal(result.body.message, "Invalid or expired token");
});

test("user can register and login", async () => {
  const uniqueEmail = `integration-${Date.now()}@example.com`;

  const register = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: uniqueEmail,
      password: "Password123",
      name: "Integration Test User",
    }),
  });

  assert.equal(register.status, 201);
  assert.equal(register.body.user.email, uniqueEmail);
  assert.ok(register.body.user.id);
  assert.ok(register.body.organization.id);
  assert.equal(register.body.role, "org_admin");

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: uniqueEmail,
      password: "Password123",
    }),
  });

  assert.equal(login.status, 200);
  assert.ok(login.body.accessToken);
  assert.ok(login.body.refreshToken);
  assert.equal(login.body.user.email, uniqueEmail);
});
