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

async function createSecondUser() {
  const email = `second-user-${Date.now()}-${Math.random()}@example.com`;

  const register = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123",
      name: "Second Test User",
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
  };
}

/* =========================================================
   ORGANIZATION TESTS
   ========================================================= */

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

/* =========================================================
   PROJECT TESTS
   ========================================================= */

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

/* =========================================================
   AUTHORIZATION TESTS
   ========================================================= */

test("organization member cannot add another member", async () => {
  const admin = await createTestUser();
  const member = await createSecondUser();

  /*
   * First, the admin adds the second user to the organization.
   * This makes the second user an actual organization member.
   */
  const addMemberAsAdmin = await request(
    `/organizations/${admin.organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        userId: member.user.id,
        role: "member",
      }),
    }
  );

  assert.equal(addMemberAsAdmin.status, 201);

  /*
   * Now the member attempts to add another member.
   * This should fail because only org_admin can add members.
   */
  const addMemberAsMember = await request(
    `/organizations/${admin.organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${member.token}`,
      },
      body: JSON.stringify({
        userId: admin.user.id,
        role: "member",
      }),
    }
  );

  assert.equal(addMemberAsMember.status, 403);
  assert.equal(
    addMemberAsMember.body.message,
    "Only organization admins can add members"
  );
});

test("organization member cannot change member roles", async () => {
  const admin = await createTestUser();
  const member = await createSecondUser();

  /*
   * Admin adds the second user as a regular member.
   */
  const addMember = await request(
    `/organizations/${admin.organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        userId: member.user.id,
        role: "member",
      }),
    }
  );

  assert.equal(addMember.status, 201);

  /*
   * Regular member attempts to promote themselves.
   */
  const changeRole = await request(
    `/organizations/${admin.organization.id}/members/${member.user.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${member.token}`,
      },
      body: JSON.stringify({
        role: "org_admin",
      }),
    }
  );

  assert.equal(changeRole.status, 403);
  assert.equal(
    changeRole.body.message,
    "Only organization admins can change member roles"
  );
});

test("organization member cannot remove another member", async () => {
  const admin = await createTestUser();
  const member = await createSecondUser();

  /*
   * Admin adds the second user as a regular member.
   */
  const addMember = await request(
    `/organizations/${admin.organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        userId: member.user.id,
        role: "member",
      }),
    }
  );

  assert.equal(addMember.status, 201);

  /*
   * Regular member attempts to remove the admin.
   */
  const removeMember = await request(
    `/organizations/${admin.organization.id}/members/${admin.user.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${member.token}`,
      },
    }
  );

  assert.equal(removeMember.status, 403);
  assert.equal(
    removeMember.body.message,
    "Only organization admins can remove members"
  );
});

test("user cannot access an organization they do not belong to", async () => {
  const user1 = await createTestUser();
  const user2 = await createSecondUser();

  /*
   * user2 is authenticated but is not a member of user1's organization.
   */
  const result = await request(
    `/organizations/${user1.organization.id}`,
    {
      headers: {
        Authorization: `Bearer ${user2.token}`,
      },
    }
  );

  assert.equal(result.status, 403);
  assert.equal(
    result.body.message,
    "You are not a member of this organization"
  );
});

test("user cannot list members of another organization", async () => {
  const user1 = await createTestUser();
  const user2 = await createSecondUser();

  /*
   * user2 is authenticated but does not belong to user1's organization.
   */
  const result = await request(
    `/organizations/${user1.organization.id}/members`,
    {
      headers: {
        Authorization: `Bearer ${user2.token}`,
      },
    }
  );

  assert.equal(result.status, 403);
  assert.equal(
    result.body.message,
    "You are not a member of this organization"
  );
});

test("creating organization rejects invalid name", async () => {
  const { token } = await createTestUser();

  const result = await request("/organizations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "A",
    }),
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Validation failed");
  assert.ok(Array.isArray(result.body.errors));
});

test("creating organization rejects missing name", async () => {
  const { token } = await createTestUser();

  const result = await request("/organizations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Validation failed");
  assert.ok(Array.isArray(result.body.errors));
});

test("adding organization member rejects invalid userId", async () => {
  const { token, organization } = await createTestUser();

  const result = await request(
    `/organizations/${organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: "not-a-uuid",
        role: "member",
      }),
    }
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Validation failed");
  assert.ok(Array.isArray(result.body.errors));
});

test("adding organization member rejects invalid role", async () => {
  const { token, organization } = await createTestUser();

  const result = await request(
    `/organizations/${organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: "00000000-0000-0000-0000-000000000000",
        role: "admin",
      }),
    }
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Validation failed");
  assert.ok(Array.isArray(result.body.errors));
});

test("changing member role rejects invalid role", async () => {
  const admin = await createTestUser();
  const member = await createSecondUser();

  const addMember = await request(
    `/organizations/${admin.organization.id}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        userId: member.user.id,
        role: "member",
      }),
    }
  );

  assert.equal(addMember.status, 201);

  const result = await request(
    `/organizations/${admin.organization.id}/members/${member.user.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        role: "admin",
      }),
    }
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Validation failed");
  assert.ok(Array.isArray(result.body.errors));
});